const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const { expect } = chai;
chai.use(chaiAsPromised);

const Validation = require('../../../lib/Validation.js');

/* eslint-disable no-unused-expressions */
describe('Validation', () => {
  describe('SimpleField', () => {
    it('should create an instance', () => {
      const sf1 = Validation.SimpleField();
      expect(sf1).to.be.an('object');
      expect(sf1.condition).to.be.an.instanceOf(Function);
      expect(sf1.condition()).to.be.true;
      expect(sf1.validators).to.be.an.instanceOf(Array);
      expect(sf1.validators.length).to.equal(0);

      const sf2 = Validation.SimpleField([ () => (true) ]);
      expect(sf2).to.be.an('object');
      expect(sf2.condition).to.be.an.instanceOf(Function);
      expect(sf2.validators).to.be.an.instanceOf(Array);
      expect(sf2.validators.length).to.equal(1);
    });
  });

  describe('ObjectField', () => {
    it('should create an instance', () => {
      const sf1 = Validation.ObjectField();
      expect(sf1).to.be.an('object');
      expect(sf1.children).to.be.an('object');
      expect(Object.keys(sf1.children).length).to.equal(0);
      expect(sf1.condition).to.be.an.instanceOf(Function);
      expect(sf1.condition()).to.be.true;
      expect(sf1.validators).to.be.an.instanceOf(Array);
      expect(sf1.validators.length).to.equal(0);

      const sf2 = Validation.ObjectField({
        f1: Validation.SimpleField()
      });
      expect(sf2).to.be.an('object');
      expect(sf2.children).to.be.an('object');
      expect(Object.keys(sf2.children).length).to.equal(1);
      expect(sf2.children.f1).to.be.an('object');
      expect(sf2.condition).to.be.an.instanceOf(Function);
      expect(sf2.condition()).to.be.true;
      expect(sf2.validators).to.be.an.instanceOf(Array);
      expect(sf2.validators.length).to.equal(0);

      const sf3 = Validation.ObjectField({}, [ () => (true) ]);
      expect(sf3).to.be.an('object');
      expect(sf3.condition).to.be.an.instanceOf(Function);
      expect(sf3.condition()).to.be.true;
      expect(sf3.validators).to.be.an.instanceOf(Array);
      expect(sf3.validators.length).to.equal(1);
    });
  });

  describe('ArrayObjectField', () => {
    it('should create an instance', () => {
      const sf1 = Validation.ArrayObjectField();
      expect(sf1).to.be.an('object');
      expect(sf1.children).to.be.an('object');
      expect(Object.keys(sf1.children).length).to.equal(0);
      expect(sf1.condition).to.be.an.instanceOf(Function);
      expect(sf1.condition()).to.be.true;
      expect(sf1.validators).to.be.an.instanceOf(Array);
      expect(sf1.validators.length).to.equal(0);

      const sf2 = Validation.ArrayObjectField({
        f1: new Validation.SimpleField()
      });
      expect(sf2).to.be.an('object');
      expect(sf2.children).to.be.an('object');
      expect(Object.keys(sf2.children).length).to.equal(1);
      expect(sf2.children.f1).to.be.an('object');
      expect(sf2.condition).to.be.an.instanceOf(Function);
      expect(sf2.condition()).to.be.true;
      expect(sf2.validators).to.be.an.instanceOf(Array);
      expect(sf2.validators.length).to.equal(0);

      const sf3 = Validation.ArrayObjectField({}, [ () => (true) ]);
      expect(sf3).to.be.an('object');
      expect(sf3.condition).to.be.an.instanceOf(Function);
      expect(sf3.condition()).to.be.true;
      expect(sf3.validators).to.be.an.instanceOf(Array);
      expect(sf3.validators.length).to.equal(1);
    });
  });

  describe('processor', () => {
    it('should return a Promise', () => {
      const p = Validation.processor({}, {});
      expect(p instanceof Promise).to.be.true;
    });

    it('should throw an error if a valid field type object has not been used', () => {
      expect(() => {
        Validation.processor({
          f1: {
            condition: () => (true)
          }
        }, {});
      }).to.throw(/Unknown or unspecified validator type/i);
    });

    it('should throw an error if a non-function validator has been used', () => {
      expect(() => {
        Validation.processor({
          f1: Validation.SimpleField([ '**not a function**' ])
        }, {});
      }).to.throw(Error);
    });

    it('should have more than 1 error per field when multiple rules are broken, and reduceErrors is false', () => {
      const fieldValidators = {
        f1: Validation.SimpleField([
          Validation.rules.required,
          Validation.rules.email
        ])
      };
      const context = {};
      const p = Validation.processor(fieldValidators, context);
      expect(p instanceof Promise).to.be.true;
      return p.catch((errors) => {
        expect(errors.f1.length).to.equal(2);
      });
    });

    it('should reduce any errors to a single error for each field when given the reduceErrors option', () => {
      const fieldValidators = {
        f1: Validation.SimpleField([
          Validation.rules.required,
          Validation.rules.email
        ])
      };
      const context = {};
      const p = Validation.processor(fieldValidators, context, {
        reduceErrors: true
      });
      expect(p instanceof Promise).to.be.true;
      return p.catch((errors) => {
        expect(errors.f1.length).to.equal(1);
      });
    });

    describe('SimpleField', () => {
      it('should resolve a Promise for valid data', () => {
        const fieldValidators = {
          f1: Validation.SimpleField([
            Validation.rules.required
          ])
        };
        const context = {
          f1: 'hello'
        };
        const p = Validation.processor(fieldValidators, context);
        expect(p instanceof Promise).to.be.true;
        return expect(p).to.be.fulfilled;
      });

      it('should resolve a Promise if optional data is missing', () => {
        const queue = [];

        const fieldValidators = {
          f1: Validation.SimpleField([
            Validation.rules.optional,
            Validation.rules.required
          ])
        };
        const context = {};
        const p = Validation.processor(fieldValidators, context);
        expect(p instanceof Promise).to.be.true;
        queue.push(expect(p).to.be.fulfilled);

        const fieldValidators2 = {
          f1: Validation.SimpleField([
            Validation.rules.optional,
            Validation.rules.required
          ]),
          f2: Validation.SimpleField([
            Validation.rules.optional,
            Validation.rules.required
          ])
        };
        const context2 = {
          f2: 'data'
        };
        const p2 = Validation.processor(fieldValidators2, context2);
        expect(p2 instanceof Promise).to.be.true;
        queue.push(expect(p2).to.be.fulfilled);

        return Promise.all(queue);
      });

      it('should resolve a Promise for valid data containing hyphenated field names', () => {
        const fieldValidators = {
          'field-one-two': Validation.SimpleField([
            Validation.rules.required
          ])
        };
        const context = {
          'field-one-two': 'hello'
        };
        const p = Validation.processor(fieldValidators, context);
        expect(p instanceof Promise).to.be.true;
        return expect(p).to.be.fulfilled;
      });

      it('should skip validation if the field condition is not met', () => {
        const fieldValidators = {
          f1: Validation.SimpleField([
            Validation.rules.required
          ], () => (false))
        };
        const context = {};
        const p = Validation.processor(fieldValidators, context);
        expect(p instanceof Promise).to.be.true;
        return expect(p).to.be.fulfilled;
      });

      it('should reject a Promise for invalid data', () => {
        const queue = [];

        const fieldValidators = {
          f1: Validation.SimpleField([
            Validation.rules.required
          ])
        };
        const context = {};
        const p = Validation.processor(fieldValidators, context);
        expect(p instanceof Promise).to.be.true;
        queue.push(expect(p).to.be.rejected);
        queue.push(expect(p.catch(err => Promise.reject(JSON.stringify(err)))).to.be.rejectedWith(/validation:rule\.required/i));

        return Promise.all(queue);
      });

      it('should show custom error message when defined', () => {
        const queue = [];

        const fieldValidators = {
          f1: Validation.SimpleField([
            Validation.rules.required.bind({
              errorMsg: 'TEST_REQUIRED'
            })
          ])
        };
        const context = {};
        const p = Validation.processor(fieldValidators, context);
        expect(p instanceof Promise).to.be.true;
        queue.push(expect(p).to.be.rejected);
        queue.push(expect(p.catch(err => Promise.reject(JSON.stringify(err)))).to.be.rejectedWith(/TEST_REQUIRED/i));

        return Promise.all(queue);
      });

      it('should reject with return a linear array of errors (no nested objects)', () => {
        const queue = [];

        const fieldValidators = {
          f1: Validation.SimpleField([
            Validation.rules.required.bind({
              errorMsg: [ 'TEST_REQUIRED', 'ANOTHER_ERROR', [ 'SUB1', 'SUB2', { inline: 'E1', summary: 'E1' } ] ]
            })
          ])
        };
        const context = {};
        const p = Validation.processor(fieldValidators, context);
        expect(p instanceof Promise).to.be.true;
        queue.push(expect(p).to.be.rejected);
        queue.push(expect(p.catch(err => Promise.reject(new Error(`LEN:${err.f1.length}`)))).to.be.rejectedWith(/LEN:5/i));

        return Promise.all(queue);
      });
    });

    describe('ObjectField', () => {
      it('should resolve a Promise for valid data', () => {
        const fieldValidators = {
          f1: Validation.ObjectField({
            subf1: Validation.SimpleField([
              Validation.rules.required
            ]),
            subf2: Validation.SimpleField([
              Validation.rules.required
            ]),
            subf3: Validation.ObjectField({
              subsubf1: Validation.SimpleField([
                Validation.rules.required
              ])
            })
          })
        };
        const context = {
          f1: {
            subf1: 'hello',
            subf2: 'world',
            subf3: {
              subsubf1: 'deep'
            }
          }
        };
        const p = Validation.processor(fieldValidators, context);
        expect(p instanceof Promise).to.be.true;
        return expect(p).to.be.fulfilled;
      });
    });

    describe('ArrayObjectField', () => {
      it('should resolve a Promise for valid data', () => {
        const fieldValidators = {
          f1: Validation.ArrayObjectField({
            subf1: Validation.SimpleField([
              Validation.rules.required
            ]),
            subf2: Validation.SimpleField([
              Validation.rules.required
            ]),
            subf3: Validation.ObjectField({
              subsubf1: Validation.SimpleField([
                Validation.rules.required
              ])
            })
          })
        };
        const context = {
          f1: [ {
            subf1: 'hello',
            subf2: 'world',
            subf3: {
              subsubf1: 'deep'
            }
          } ]
        };
        const p = Validation.processor(fieldValidators, context);
        expect(p instanceof Promise).to.be.true;
        return expect(p).to.be.fulfilled;
      });

      it('should resolve a Promise for non-array data', () => {
        const fieldValidators = {
          f1: Validation.ArrayObjectField({
            subf1: Validation.SimpleField([
              Validation.rules.required
            ]),
            subf2: Validation.SimpleField([
              Validation.rules.required
            ]),
            subf3: Validation.ObjectField({
              subsubf1: Validation.SimpleField([
                Validation.rules.required
              ])
            })
          })
        };
        const context = {
          f1: {}
        };
        const p = Validation.processor(fieldValidators, context);
        expect(p instanceof Promise).to.be.true;
        return expect(p).to.be.fulfilled;
      });

      it('should reject a Promise for invalid data', () => {
        const fieldValidators = {
          f1: Validation.ArrayObjectField({
            subf1: Validation.SimpleField([
              Validation.rules.required
            ]),
            subf2: Validation.SimpleField([
              Validation.rules.required
            ]),
            subf3: Validation.ObjectField({
              subsubf1: Validation.SimpleField([
                Validation.rules.required
              ])
            })
          })
        };
        const context = {
          f1: [ {
            /* subf1: 'hello',
            subf2: 'world',
            subf3: {
              subsubf1: 'deep',
            } */
          } ]
        };
        const p = Validation.processor(fieldValidators, context);
        expect(p instanceof Promise).to.be.true;
        return expect(p).to.be.rejected;
      });
    });
  });
});
/* eslint-enable no-unused-expressions */
