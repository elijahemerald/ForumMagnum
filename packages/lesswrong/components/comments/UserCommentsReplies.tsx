import { Components, registerComponent, slugify } from '../../lib/vulcan-lib';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { useMulti } from '../../lib/crud/withMulti';
import { getUserFromResults } from '../users/UsersProfile';

const styles = (theme: ThemeType): JssStyles =>  ({
  root: {
    [theme.breakpoints.up('sm')]: {
      marginRight: theme.spacing.unit*4,
    }
  }
})

const UserCommentsReplies = ({ classes }) => {
  const { SingleColumnSection, SectionTitle, Loading } = Components

  const { params } = useLocation();
  const slug = slugify(params.slug);

  const {results: userResults} = useMulti({
    terms: {view: 'usersProfile', slug},
    collectionName: "Users",
    fragmentName: 'UsersProfile',
    enableTotal: false,
  });
  const user = getUserFromResults(userResults ?? null)
  const { loadingInitial, loadMoreProps, results } = useMulti({
    terms: {view: 'allRecentComments', authorIsUnreviewed: null, limit: 50, userId: user?._id},
    collectionName: "Comments",
    fragmentName: 'CommentsListWithParentMetadata',
    enableTotal: false,
    skip: !user
  });
  
  if (loadingInitial || !user) return <Loading />
  if (!results || results.length < 1) return <SingleColumnSection>
    This user has not made any comments
  </SingleColumnSection>

  return (
    <SingleColumnSection>
      <SectionTitle title={`All of ${user.displayName}'s Comments + Replies`}/>
      <div className={classes.root}>
        {results.map(comment =>
          <div key={comment._id}>
            <Components.CommentsNode
              treeOptions={{
                condensed: false,
                post: comment.post || undefined,
                tag: comment.tag || undefined,
                showPostTitle: true,
              }}
              comment={comment}
              startThreadTruncated={true}
              forceNotSingleLine
              loadChildrenSeparately
              loadDirectReplies
            />
          </div>
        )}
        <Components.LoadMore {...loadMoreProps} />
      </div>
    </SingleColumnSection>
  )
};

const UserCommentsRepliesComponent = registerComponent('UserCommentsReplies', UserCommentsReplies, { styles });

declare global {
  interface ComponentTypes {
    UserCommentsReplies: typeof UserCommentsRepliesComponent,
  }
}
