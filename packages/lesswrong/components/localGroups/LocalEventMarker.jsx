/* global google */
import React from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import { getArrowIcon } from './Icons'

const LocalEventMarker = ({ event, handleMarkerClick, handleInfoWindowClose, infoOpen, location, classes }) => {
  const { html = "" } = event.contents || {}
  const { GroupLinks, StyledMapMarker } = Components
  const htmlBody = {__html: html};
  const arrowIcon = getArrowIcon(google)
  
  return (
    <StyledMapMarker
      location={location}
      handleOpen={() => handleMarkerClick(event._id)}
      handleClose={() => handleInfoWindowClose(event._id)}
      infoOpen={infoOpen}
      icon={arrowIcon}
      link={Posts.getPageUrl(event)}
      title={` [Event] ${event.title} `}
      metaInfo={event.contactInfo}
      cornerLinks={<GroupLinks document={event}/>}
    >
      <div dangerouslySetInnerHTML={htmlBody} />
    </StyledMapMarker>
  )
}

LocalEventMarker.propTypes = {
  event: PropTypes.object.isRequired,
  location: PropTypes.object,
}

registerComponent("LocalEventMarker", LocalEventMarker);
