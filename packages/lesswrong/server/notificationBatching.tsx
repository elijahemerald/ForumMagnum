import React from 'react';
import { Notifications } from '../lib/collections/notifications/collection';
import { getNotificationTypes } from '../lib/notificationTypes';
import { getNotificationTypeByNameServer } from './notificationTypesServer';
import { EventDebouncer } from './debouncer';
import toDictionary from '../lib/utils/toDictionary';
import { userIsAdmin } from '../lib/vulcan-users/permissions';
import { getUser } from '../lib/vulcan-users/helpers';
import { Posts } from '../lib/collections/posts';
import { Components } from '../lib/vulcan-lib/components';
import { addGraphQLQuery, addGraphQLSchema, addGraphQLResolvers } from '../lib/vulcan-lib/graphql';
import { wrapAndSendEmail, wrapAndRenderEmail } from './emails/renderEmail';
import { getUserEmail } from '../lib/collections/users/helpers';

// string (notification type name) => Debouncer
export const notificationDebouncers = toDictionary(getNotificationTypes(),
  notificationTypeName => notificationTypeName,
  notificationTypeName => {
    return new EventDebouncer({
      name: `notification_${notificationTypeName}`,
      defaultTiming: {
        type: "delayed",
        delayMinutes: 15,
      },
      callback: ({ userId, notificationType }: {userId: string, notificationType: string}, notificationIds: Array<string>) => {
        void sendNotificationBatch({userId, notificationIds});
      }
    });
  }
);

// Precondition: All notifications in a batch share a notification type
const sendNotificationBatch = async ({userId, notificationIds}: {userId: string, notificationIds: Array<string>}) => {
  if (!notificationIds || !notificationIds.length)
    throw new Error("Missing or invalid argument: notificationIds (must be a nonempty array)");
  
  const user = await getUser(userId);
  if (!user) throw new Error(`Missing user: ID ${userId}`);
  await Notifications.rawUpdateMany(
    { _id: {$in: notificationIds} },
    { $set: { waitingForBatch: false } },
    { multi: true }
  );
  const notificationsToEmail = await Notifications.find(
    { _id: {$in: notificationIds}, emailed: true }
  ).fetch();
  
  if (notificationsToEmail.length) {
    const emails = await notificationBatchToEmails({
      user, notifications: notificationsToEmail
    });
    
    for (let email of emails) {
      await wrapAndSendEmail(email);
    }
  }
}

const notificationBatchToEmails = async ({user, notifications}: {user: DbUser, notifications: Array<DbNotification>}) => {
  const notificationType = notifications[0].type;
  const notificationTypeRenderer = getNotificationTypeByNameServer(notificationType);
  
  if (notificationTypeRenderer.canCombineEmails) {
    return [{
      user,
      from: notificationTypeRenderer.from,
      subject: await notificationTypeRenderer.emailSubject({ user, notifications }),
      body: await notificationTypeRenderer.emailBody({ user, notifications }),
    }];
  } else {
    return await Promise.all(notifications.map(async (notification: DbNotification) => ({
      user,
      to: getUserEmail(user),
      from: notificationTypeRenderer.from,
      subject: await notificationTypeRenderer.emailSubject({ user, notifications:[notification] }),
      body: await notificationTypeRenderer.emailBody({ user, notifications:[notification] }),
    })));
  }
}


addGraphQLResolvers({
  Query: {
    async EmailPreview(root: void, {notificationIds, postId}: {notificationIds?: Array<string>, postId?: string}, context: ResolverContext) {
      const { currentUser } = context;
      if (!currentUser || !userIsAdmin(currentUser)) {
        throw new Error("This debug feature is only available to admin accounts");
      }
      if (!notificationIds?.length && !postId) {
        return [];
      }
      if (notificationIds?.length && postId) {
        throw new Error("Please only specify notificationIds or postId in the query")
      }
      
      let emails:any[] = []
      if (notificationIds?.length) {
        const notifications = await Notifications.find(
          { _id: {$in: notificationIds} }
        ).fetch();
        emails = await notificationBatchToEmails({
          user: currentUser,
          notifications
        });
      }
      if (postId) {
        const post = await Posts.findOne(postId)
        if (post) {
          emails = [{
            user: currentUser,
            subject: post.title,
            body: <Components.NewPostEmail documentId={post._id} reason='you have the "Email me new posts in Curated" option enabled' />
          }]
        }
      }
      const renderedEmails = await Promise.all(emails.map(async email => await wrapAndRenderEmail(email)));
      return renderedEmails;
    }
  }
});
addGraphQLSchema(`
  type EmailPreview {
    to: String
    subject: String
    html: String
    text: String
  }
`);
addGraphQLQuery("EmailPreview(notificationIds: [String], postId: String): [EmailPreview]");
