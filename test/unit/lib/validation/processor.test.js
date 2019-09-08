const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const { expect } = chai;
chai.use(chaiAsPromised);

const {
  processor,
  SimpleField,
  ObjectField,
  ArrayObjectField,
  rules,
} = require('../../../../lib/validation/index.js');

describe('Validation: processor', () => {
  describe('processor', () => {
    it('should return a Promise', () => {
      const p = processor();
      expect(p).to.be.an.instanceOf(Promise);
    });

    it('should throw an error if a valid field type object has not been used', () => {
      expect(() => {
        processor({
          f1: {
            type: 'not-a-valid-type',
            condition: () => (true),
          },
        }, {});
      }).to.throw(/Unknown or unspecified validator type/i);
    });

    it('should have more than 1 error per field when multiple rules are broken, and reduceErrors is false', async () => {
      const fieldValidators = {
        f1: SimpleField([
          () => (Promise.reject()),
          () => (Promise.reject()),
        ]),
      };
      try {
        await processor(fieldValidators);
        throw new Error('unexpected-resolve');
      } catch (errors) {
        expect(errors).to.have.property('f1').with.length(2);
      }
    });

    it('should reduce any errors to a single error for each field when given the reduceErrors option', async () => {
      const fieldValidators = {
        f1: SimpleField([
          () => (Promise.reject()),
          () => (Promise.reject()),
        ]),
      };
      try {
        await processor(fieldValidators, {}, {
          reduceErrors: true,
        });
        throw new Error('unexpected-resolve');
      } catch (errors) {
        expect(errors).to.have.property('f1').with.length(1);
      }
    });

    describe('SimpleField', () => {
      it('should resolve a Promise for valid data', () => {
        const fieldValidators = {
          f1: SimpleField([
            () => (Promise.resolve()),
          ]),
        };
        const p = processor(fieldValidators);
        return expect(p).to.be.fulfilled;
      });

      it('should resolve a Promise if optional data is missing', async () => {
        const fieldValidators = {
          f1: SimpleField([
            rules.optional,
            () => (Promise.reject()), // Shouldn't get called, as it's optional
          ]),
        };
        await expect(processor(fieldValidators)).to.be.fulfilled;

        const fieldValidators2 = {
          f1: SimpleField([
            rules.optional,
            () => (Promise.resolve()),
          ]),
          f2: SimpleField([
            rules.optional,
            () => (Promise.resolve()),
          ]),
        };
        const context2 = {
          f2: 'data',
        };
        await expect(processor(fieldValidators2, context2)).to.be.fulfilled;
      });

      it('should resolve a Promise for valid data containing hyphenated field names', async () => {
        const fieldValidators = {
          'field-one-two': SimpleField([
            () => (Promise.resolve()),
          ]),
        };
        const context = {
          'field-one-two': 'hello',
        };
        await expect(processor(fieldValidators, context)).to.be.fulfilled;
      });

      it('should skip validation if the field conditional is not met', async () => {
        const fieldValidators = {
          f1: SimpleField([
            () => (Promise.reject()),
          ], () => (false)),
        };
        await expect(processor(fieldValidators)).to.be.fulfilled;
      });

      it('should reject a Promise for invalid data', async () => {
        const fieldValidators = {
          f1: SimpleField([
            function testValidator() {
              return Promise.reject(new Error('test-validator-fail'));
            },
          ]),
        };
        const p = processor(fieldValidators);
        await expect(p).to.be.rejected;
        await expect(p.catch((err) => Promise.reject(JSON.stringify(err)))).to.be.rejectedWith(/test-validator-fail/i);
      });

      it('should flatten a field\'s errors into a flat array (no nested objects)', async () => {
        const fieldValidators = {
          f1: SimpleField([
            () => (Promise.reject(['TEST_REQUIRED', 'ANOTHER_ERROR', ['SUB1', 'SUB2', { inline: 'E1', summary: 'E1' }]])),
          ]),
        };
        const p = processor(fieldValidators, context);
        await expect(p).to.be.rejected;
        await expect(p.catch((err) => Promise.reject(new Error(`LEN:${err.f1.length}`)))).to.be.rejectedWith(/LEN:5/i);
      });
    });

    describe('ObjectField', () => {
      it('should resolve a Promise for valid data', async () => {
        const fieldValidators = {
          f1: ObjectField({
            subf1: SimpleField([
              () => (Promise.resolve()),
            ]),
            subf2: SimpleField([
              () => (Promise.resolve()),
            ]),
            subf3: ObjectField({
              subsubf1: SimpleField([
                () => (Promise.resolve()),
              ]),
            }),
          }),
        };
        const p = processor(fieldValidators);
        await expect(p).to.be.fulfilled;
      });

      it('should reject a Promise for invalid data', async () => {
        const fieldValidators = {
          f1: ObjectField({
            subf1: SimpleField([
              () => (Promise.resolve()),
            ]),
            subf2: SimpleField([
              () => (Promise.resolve()),
            ]),
            subf3: ObjectField({
              subsubf1: SimpleField([
                () => (Promise.reject()),
              ]),
            }),
          }),
        };
        const p = processor(fieldValidators);
        await expect(p).to.be.rejected;
        await p.catch((errors) => {
          expect(errors).to.have.property('f1[subf3][subsubf1]').with.length(1);
        });
      });
    });

    describe('ArrayObjectField', () => {
      it('should resolve a Promise for valid data', async () => {
        const fieldValidators = {
          f1: ArrayObjectField({
            subf1: SimpleField([
              () => (Promise.resolve()),
            ]),
            subf2: SimpleField([
              () => (Promise.resolve()),
            ]),
            subf3: ObjectField({
              subsubf1: SimpleField([
                () => (Promise.resolve()),
              ]),
            }),
          }),
        };
        const p = processor(fieldValidators, {
          f1: [{
            subf1: undefined,
            subf2: undefined,
            subf3: {
              subsubf1: undefined,
            },
          }],
        });
        await expect(p).to.be.fulfilled;
      });

      it('should resolve a Promise for non-array data', async () => {
        const fieldValidators = {
          f1: ArrayObjectField({
            subf1: SimpleField([
              () => (Promise.resolve()),
            ]),
            subf2: SimpleField([
              () => (Promise.resolve()),
            ]),
            subf3: ObjectField({
              subsubf1: SimpleField([
                () => (Promise.resolve()),
              ]),
            }),
          }),
        };
        const p = processor(fieldValidators, {
          f1: {},
        });
        await expect(p).to.be.fulfilled;
      });

      it('should reject a Promise for invalid data', () => {
        const fieldValidators = {
          f1: ArrayObjectField({
            subf1: SimpleField([
              () => (Promise.reject()),
            ]),
          }),
        };
        const p = processor(fieldValidators, {
          f1: [{
            subf1: null,
          }],
        });
        return expect(p).to.be.rejected;
      });
    });
  });
});
