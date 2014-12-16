Package.describe({
  name: 'dburles:reactive-relations',
  summary: 'Intelligent reactive relational publications',
  version: '0.1.7',
  git: 'https://github.com/dburles/reactive-relations.git'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0');
  api.addFiles('reactive-relations.js');
});
