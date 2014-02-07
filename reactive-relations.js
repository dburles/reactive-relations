if (Meteor.isClient) {
  Meteor.subscribeReactive = function(name) {
    var mapper = Reactive[name];
    var relations = mapper.relations;

    Meteor.subscribe(name);
    console.log('subscribing to ' + name);

    Deps.autorun(function() {
      var keyValues = {};

      _.each(relations, function(relation) {
        if (! relation.parentKey)
          relation.parentKey = '_id';

        keyValues[relation.parentKey] = _.uniq(mapper.cursor().map(function(doc) { return doc[relation.parentKey]; }));
        console.log('subscribing to ' + relation.collection()._name);
        Meteor.subscribe(name + '_' + relation.collection()._name, keyValues[relation.parentKey]);
      });
    });
  };
}

if (Meteor.isServer) {
  Meteor.publishReactive = function(name) {
    var mapper = Reactive[name];
    var relations = mapper.relations;

    Meteor.publish(name, function() {
      console.log('publishing ' + name);
      // console.log(keyValues);

      return mapper.cursor();
      // return [
      //   mapper.cursor(),
      // ].concat(relationCursors);
    });

    _.each(relations, function(relation) {
      if (! relation.parentKey)
        relation.parentKey = '_id';

      // console.log(relation.query, relation.options);

      Meteor.publish(name + '_' + relation.collection()._name, function(keyValues) {
        // on first subscribe, server resolves the relationships
        if (keyValues && keyValues.length === 0)
          keyValues = _.uniq(mapper.cursor().map(function(doc) { return doc[relation.parentKey]; }));

        // build query
        if (! relation.key)
          relation.key = '_id';
        if (! relation.query)
          relation.query = {};
        if (! relation.options)
          relation.options = {};

        // manually pass in things to join on
        if (relation.map) {
          if (! relation.map.key)
            relation.map.key = '_id';
          relation.query[relation.map.key] = { $in: relation.map.values() };
        } else {
          relation.query[relation.key] = { $in: keyValues };
        }

        return relation.collection().find(relation.query, relation.options);
      });
    });
  };
}
