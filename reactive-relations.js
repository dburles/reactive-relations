if (Meteor.isClient) {
  Meteor.subscribeReactive = function(name) {
    var mapper = Reactive[name];
    var relations = mapper.relations;

    // console.log('subscribing to ' + name + '_' + mapper.cursor().collection.name);
    var handles = [Meteor.subscribe(name + '_' + mapper.cursor().collection.name)];

    _.each(relations, function(relation) {
      if (! relation.parentKey)
        relation.parentKey = '_id';

      Deps.autorun(function() {
        var keyValues = mapper.cursor().map(function(doc) { return doc[relation.parentKey]; });
        // console.log('subscribing to ' + name + '_' + relation.collection()._name);
        handles.push(Meteor.subscribe(name + '_' + relation.collection()._name, _.uniq(keyValues)));
      });
    });

    return handles;
  };
}

if (Meteor.isServer) {
  Meteor.publishReactive = function(name) {
    var mapper = Reactive[name];
    var relations = mapper.relations;

    Meteor.publish(name + '_' + mapper.cursor()._cursorDescription.collectionName, function() {
      // console.log('call to ' + name);
      return mapper.cursor();
    });

    _.each(relations, function(relation) {
      // defaults
      if (! relation.key) relation.key = '_id';
      if (! relation.parentKey) relation.parentKey = '_id';
      if (! relation.query) relation.query = {};
      if (! relation.options) relation.options = {};

      Meteor.publish(name + '_' + relation.collection()._name, function(keyValues) {
        // console.log('call to ' + name + '_' + relation.collection()._name);
        // on first subscribe, server resolves the relationships
        if (keyValues && keyValues.length === 0)
          keyValues = mapper.cursor().map(function(doc) { return doc[relation.parentKey]; });

        relation.query[relation.key] = { $in: _.uniq(keyValues) };

        // console.log(relation.query, relation.options);

        return relation.collection().find(relation.query, relation.options);
      });
    });
  };
}
