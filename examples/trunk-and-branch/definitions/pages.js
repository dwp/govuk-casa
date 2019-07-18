/**
 * Declarative definitions of pages within a user journey.
 */

const reviewPageDefinition = require('@dwp/govuk-casa/definitions/review-page');

module.exports = (casaApp, mountUrl) => {
  const pages = {};

  /* -------------------------------------------------------- "trunk" journey */

  // The "task-list" has a custom handler, so we don't use page meta here

  pages['finish'] = {
    view: 'finish.njk',
    hooks: {
      pregather: (req, res, next) => {
        console.log(JSON.stringify(req.journeyData.getData(), null, 2));

        // Remember to clear the journey data once submitted
        casaApp.endSession(req).then(() => {
          res.status(302).redirect(`${mountUrl}what-happens-next`);
        }).catch((err) => {
          console.log(err);
          res.status(302).redirect(`${mountUrl}what-happens-next`);
        });
      },
    }
  };

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
};
