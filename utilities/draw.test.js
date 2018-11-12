const draw = require('./draw');

const secretSantaData = [
  {
    memberName: 'coutinho',
    groupName: 'liverpool'
  },
  {
    memberName: 'gerrard',
    groupName: 'liverpool',
    exclusions: ['suarez', 'torres']
  },
  {
    memberName: 'torres',
    groupName: 'liverpool'
  },
  {
    memberName: 'suarez',
    groupName: 'liverpool'
  }
];

const namesInHat = ['coutinho', 'gerrard', 'torres', 'suarez'];

describe('Draw logic', () => {
  it('Given a list of secretSanta data, provide list of names', () => {
    expect(draw.getListOfNames(secretSantaData)).toEqual(['coutinho', 'gerrard', 'torres', 'suarez']);
  });

  it('Removes a name from the list', () => {
    expect(draw.remove('torres', namesInHat)).toEqual([
      'coutinho', 'gerrard', 'suarez'
    ]);
  });

  it('Generates draw', () => {
    expect(draw.generateDraw(namesInHat, Object.assign([], namesInHat), secretSantaData)).toMatchObject([
      {
        memberName: 'coutinho',
        secretSanta: expect.any(String)
      },
      {
        memberName: 'gerrard',
        secretSanta: expect.any(String)
      },
      {
        memberName: 'torres',
        secretSanta: expect.any(String)
      },
      {
        memberName: 'suarez',
        secretSanta: expect.any(String)
      }
    ]);
  });
});
