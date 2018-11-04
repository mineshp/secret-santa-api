const { isValidgroupID } = require('./validator');

describe('validator', () => {
  it('a groupID of 2 members is valid', () => {
    expect(isValidgroupID(['member1', 'member2'])).toBe(true);
  });

  it('a groupID of 1 member is invalid', () => {
    expect(isValidgroupID(['member1'])).toBe(false);
  });
});
