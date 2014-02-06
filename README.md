reactive-relations
==================

Intelligent reactive relational publications for Meteor

### API Examples

#### Define these between client and server

```javascript
Reactive = {
  feed: {
    cursor: function() { return Feeds.find({}, { limit: 20, sort: { createdAt: -1 }}); },
    relations: [{
      collection: function() { return Meteor.users; },
      parentKey: 'userId'
    }, {
      collection: function() { return Events; },
      parentKey: 'eventId'
    }]
  }
};
```

```javascript
Reactive = {
  authorsWithBooks: {
    cursor: function() { return Authors.find(); },
    relations: [{
      collection: function() { return Books; },
      key: 'authorId',
      filter: {},
      options: {}
    }]
  }
};
```

```javascript
Reactive = {
  topPostsWithTopComments: {
    cursor: function() { return Posts.find({}, {sort: {score: -1}, limit: 30}); },
    relations: [{
      collection: function() { return Comments; },
      map: {
        values: function() {
          var topPostsCursor = Reactive.topPostsWithTopComments.mapper.cursor();
          var postIds = topPostsCursor.map(function(p) { return p._id; });
          var commentIds = _.map(postIds, function(postId) {
            var comment = Comments.findOne({postId: postId}, {sort: {score: -1}});
            return comment._id;
          });
          return commentIds;
        }
      }
    }]
  }
};
```
