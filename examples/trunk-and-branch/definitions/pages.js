/**
 * Declarative definitions of pages within a user journey.
 */

const reviewPageDefinition = require('@dwp/govuk-casa/definitions/review-page');

module.exports = (function() {
  const pages = {};

  /* -------------------------------------------------- "preliminary" journey */

  pages['declaration'] = {
    view: 'pages/declaration.njk',
    reviewBlockView: 'review-blocks/declaration.njk',
    fieldValidators: require('./field-validators/declaration.js'),
  };

  pages['contact-details'] = {
    view: 'pages/contact-details.njk',
    reviewBlockView: 'review-blocks/contact-details.njk',
    fieldValidators: require('./field-validators/contact-details.js'),
  };

  pages['dob'] = {
    view: 'pages/dob.njk',
    reviewBlockView: 'review-blocks/dob.njk',
    fieldValidators: require('./field-validators/dob.js'),
  };


  /* -------------------------------------------------------- "books" journey */

  pages['action-books'] = {
    view: 'pages/action-books.njk',
    fieldValidators: require('./field-validators/books-generic.js'),
  };

  pages['thriller-books'] = {
    view: 'pages/thriller-books.njk',
    fieldValidators: require('./field-validators/books-generic.js'),
  };

  pages['horror-books'] = {
    view: 'pages/horror-books.njk',
    fieldValidators: require('./field-validators/books-generic.js'),
  };


  /* ------------------------------------------------------- Add review pages */

  // Review page that will be used on the "preliminary" journey
  pages['initial-review'] = reviewPageDefinition(pages);

  return pages;
})();
