import React, { useState } from 'react';
import { Components, registerComponent, getSetting } from '../../lib/vulcan-lib';
import { useUpdate } from '../../lib/crud/withUpdate';
import { useMutation } from 'react-apollo';
import { Posts } from '../../lib/collections/posts';
import Users from '../../lib/collections/users/collection';
import { Link } from '../../lib/reactRouterWrapper'
import Typography from '@material-ui/core/Typography';
import { useCurrentUser } from '../common/withUser';
import { useHover } from '../common/withHover'
import withErrorBoundary from '../common/withErrorBoundary';
import Button from '@material-ui/core/Button';
import gql from 'graphql-tag';

const SunshineNewPostsItem = ({post}: {
  post: PostsList,
}) => {
  const [selectedTags, setSelectedTags] = useState<Record<string,boolean>>({});
  const currentUser = useCurrentUser();
  const {eventHandlers, hover, anchorEl} = useHover();
  
  const {mutate: updatePost} = useUpdate({
    collection: Posts,
    fragmentName: 'PostsList',
  });
  const [applyCoreTagsMutation] = useMutation(gql`
    mutation applyCoreTagsMutation($postId: String, $tagIds: [String]) {
      applyCoreTags(postId: $postId, tagIds: $tagIds)
    }
  `);

  const applyTags = () => {
    const tagsApplied: Array<string> = [];
    for (let tagId of Object.keys(selectedTags)) {
      if (selectedTags[tagId])
        tagsApplied.push(tagId);
    }
    applyCoreTagsMutation({
      variables: {
        postId: post._id,
        tagIds: tagsApplied,
      }
    });
  }
  
  const handleReview = () => {
    applyTags();
    updatePost({
      selector: { _id: post._id},
      data: {
        reviewedByUserId: currentUser!._id,
        authorIsUnreviewed: false
      },
    })
  }

  const handlePromote = () => {
    applyTags();
    
    updatePost({
      selector: { _id: post._id},
      data: {
        frontpageDate: new Date(),
        reviewedByUserId: currentUser!._id,
        authorIsUnreviewed: false
      },
    })
  }
  
  // ea-forum-look-here This widget/form was redesigned to support core tags, and
  // had some EA-forum specific customization (for the "Move to Community"
  // button). Make sure the set of buttons here is right.
  const handleMoveToCommunity = () => {
    applyTags();
    
    updatePost({
      selector: { _id: post._id},
      data: {
        meta: true,
        reviewedByUserId: currentUser!._id,
        authorIsUnreviewed: false
      },
    })
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to move this post to the author's draft?")) {
      applyTags();
      window.open(Users.getProfileUrl(post.user), '_blank');
      updatePost({
        selector: { _id: post._id},
        data: {
          draft: true,
        }
      })
    }
  }

  const { MetaInfo, FooterTagList, PostsHighlight, SunshineListItem, SidebarHoverOver, SidebarInfo, CoreTagsChecklist } = Components
  const { html: modGuidelinesHtml = "" } = post.moderationGuidelines || {}
  const { html: userGuidelinesHtml = "" } = post.user.moderationGuidelines || {}

  return (
    <span {...eventHandlers}>
      <SunshineListItem hover={hover}>
        <SidebarHoverOver hover={hover} anchorEl={anchorEl}>
          <Typography variant="title">
            <Link to={Posts.getPageUrl(post)}>
              { post.title }
            </Link>
          </Typography>
          <br/>
          <div>
            <MetaInfo>
              { (post.moderationStyle || post.user.moderationStyle) && <span>Mod Style: </span> }
              { post.moderationStyle || post.user.moderationStyle }
              {!post.moderationStyle && post.user.moderationStyle && <span> (Default User Style)</span>}
            </MetaInfo>
          </div>
          <div>
            <MetaInfo>
              { (modGuidelinesHtml || userGuidelinesHtml) && <span>Mod Guidelines: </span> }
              <span dangerouslySetInnerHTML={{__html: modGuidelinesHtml || userGuidelinesHtml}}/>
              {!modGuidelinesHtml && userGuidelinesHtml && <span> (Default User Guideline)</span>}
            </MetaInfo>
          </div>
          <FooterTagList post={post} />
          <PostsHighlight post={post}/>
          <CoreTagsChecklist onSetTagsSelected={(selectedTags) => {
            setSelectedTags(selectedTags);
          }}/>
          
          <Button onClick={handleReview}>
            Leave on Personal Blog
          </Button>
          {post.submitToFrontpage && <Button onClick={handlePromote}>
            Move to Frontpage
          </Button>}
          {getSetting('forumType') === 'EAForum' && post.submitToFrontpage && <Button onClick={handleMoveToCommunity}>
            Move to Community
          </Button>}
          <Button onClick={handleDelete}>
            Move to Drafts
          </Button>
        </SidebarHoverOver>
        <Link to={Posts.getPageUrl(post)}>
          {post.title}
        </Link>
        <div>
          <SidebarInfo>
            { post.baseScore }
          </SidebarInfo>
          <SidebarInfo>
            <Link to={Users.getProfileUrl(post.user)}>
              {post.user && post.user.displayName}
            </Link>
          </SidebarInfo>
        </div>
      </SunshineListItem>
    </span>
  )
}

const SunshineNewPostsItemComponent = registerComponent('SunshineNewPostsItem', SunshineNewPostsItem, {
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    SunshineNewPostsItem: typeof SunshineNewPostsItemComponent
  }
}

