if (Meteor.isClient) {
  Meteor.subscribeReactive = function(name) {
    var mapper = Reactive[name];
    var relations = mapper.relations;

    // console.log('subscribing to ' + name + '_' + mapper.cursor.call(this).collection.name);
    var handles = [Meteor.subscribe(name + '_' + mapper.cursor.call(this).collection.name)];

    _.each(relations, function(relation) {
      if (! relation.parentKey)
        relation.parentKey = '_id';

      Deps.autorun(function() {
        mapper.cursor.call(this).forEach(function(doc) {
          // console.log('subscribing to ' + name + '_' + relation.collection()._name + ' with key: ' + doc[relation.parentKey]);
          handles.push(Meteor.subscribe(name + '_' + relation.collection()._name, doc[relation.parentKey]));
        });
      });
    });

    return handles;
  };
}

if (Meteor.isServer) {
  Meteor.publishReactive = function(name) {
    var mapper = Reactive[name];
    var relations = mapper.relations;

    Meteor.publish(name + '_' + mapper.cursor.call(this)._cursorDescription.collectionName, function() {
      // console.log('call to ' + name);
      return mapper.cursor.call(this);
    });

    _.each(relations, function(relation) {
      // defaults
      if (! relation.key) relation.key = '_id';
      if (! relation.parentKey) relation.parentKey = '_id';
      if (! relation.query) relation.query = {};
      if (! relation.options) relation.options = {};

      Meteor.publish(name + '_' + relation.collection()._name, function(key) {
        // console.log('call to ' + name + '_' + relation.collection()._name);
        // on first subscribe, server resolves the relationships
        if (! key)
          relation.query[relation.key] = { $in: _.uniq(mapper.cursor.call(this).map(function(doc) { return doc[relation.parentKey]; })) };
        else
          relation.query[relation.key] = key;

        // console.log(relation.query, relation.options);

        return relation.collection().find(relation.query, relation.options);
      });
    });
  };
}
