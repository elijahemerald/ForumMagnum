import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import Info from '@material-ui/icons/Info';
import { forumTitleSetting, siteNameWithArticleSetting } from '../../../lib/instanceSettings';
import { useCurrentUser } from '../../common/withUser';
import { canNominate, postEligibleForReview, postIsVoteable, reviewIsActive, REVIEW_NAME_IN_SITU, REVIEW_YEAR } from '../../../lib/reviewUtils';


const styles = (theme: ThemeType): JssStyles => ({
  reviewInfo: {
    textAlign: "center",
    marginBottom: 32
  },
  reviewLabel: {
    ...theme.typography.postStyle,
    ...theme.typography.contentNotice,
    marginBottom: theme.spacing.unit,
  },
  contentNotice: {
    ...theme.typography.contentNotice,
    ...theme.typography.postStyle
  },
  infoIcon: {
    width: 16,
    height: 16,
    marginLeft: theme.spacing.unit,
    verticalAlign: "top",
    color: theme.palette.icon.dim2,
  },
  reviewVoting: {
    textAlign: "center",
    padding: theme.spacing.unit*2,
    paddingBottom: theme.spacing.unit*6
  },
  reviewButton: {
    border: `solid 1px ${theme.palette.primary.main}`,
    paddingLeft: theme.spacing.unit*2,
    paddingRight: theme.spacing.unit*2,
    paddingTop: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
    marginTop: theme.spacing.unit,
    display: "inline-block",
    borderRadius: 3
  }
});

const PostBodyPrefix = ({post, query, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  query?: any,
  classes: ClassesType,
}) => {
  const { AlignmentCrosspostMessage, AlignmentPendingApprovalMessage, LinkPostMessage, PostsRevisionMessage, LWTooltip, ReviewVotingWidget, ReviewPostButton } = Components;
  const currentUser = useCurrentUser();

  return <>
    {reviewIsActive() && postEligibleForReview(post) && postIsVoteable(post) && <div className={classes.reviewVoting}>
      {canNominate(currentUser, post) && <ReviewVotingWidget post={post}/>}
      <ReviewPostButton post={post} year={REVIEW_YEAR+""} reviewMessage={<LWTooltip title={`Write up your thoughts on what was good about a post, how it could be improved, and how you think stands the tests of time as part of the broader ${forumTitleSetting.get()} conversation`} placement="bottom">
        <div className={classes.reviewButton}>Review</div>
      </LWTooltip>}/>
    </div>}

    <AlignmentCrosspostMessage post={post} />
    <AlignmentPendingApprovalMessage post={post} />
    
    {post.shortform && post.draft && <div className={classes.contentNotice}>
      This is a special post that holds your short-form writing. Because it's
      marked as a draft, your short-form posts will not be displayed. To un-draft
      it, pick Edit from the menu above, then click Publish.
    </div>}
    
    {post.authorIsUnreviewed && !post.draft && <div className={classes.contentNotice}>
      Because this is your first post, this post is awaiting moderator approval.
      <LWTooltip title={<p>
        New users' first posts on {siteNameWithArticleSetting.get()} are checked by moderators before they appear on the site.
        Most posts will be approved within 24 hours; posts that are spam or that don't meet site
        standards will be deleted. After you've had a post approved, future posts will appear
        immediately without waiting for review.
      </p>}>
        <Info className={classes.infoIcon}/>
      </LWTooltip>
    </div>}
    <LinkPostMessage post={post} />
    {query?.revision && post.contents && <PostsRevisionMessage post={post} />}
  </>;
}

const PostBodyPrefixComponent = registerComponent('PostBodyPrefix', PostBodyPrefix, {styles});

declare global {
  interface ComponentTypes {
    PostBodyPrefix: typeof PostBodyPrefixComponent
  }
}
