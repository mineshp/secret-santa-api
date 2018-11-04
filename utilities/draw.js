const getListOfNames = (secretSantaData) => secretSantaData.reduce((acc, member) => [...acc, member.memberName], []);

const remove = (name, list) => list.filter((i) => i !== name);

const getRandomName = (list) => list[Math.floor(Math.random() * list.length)];

let filteredList;
const pickAName = (memberName, namesList, exclusions) => {
  filteredList = remove(memberName, namesList);
  // const hasExclusion = exclusions.find((group) => group.name === memberName);

  let filteredListIncExclusions;
  if (exclusions && exclusions.length > 0) {
    exclusions.map((name) => filteredListIncExclusions = remove(name, filteredList));
  }

  return exclusions
    ? getRandomName(filteredListIncExclusions)
    : getRandomName(filteredList);
};

const generateDraw = (namesInHat, listRemaining, secretSantaGroupMembersInfo) => namesInHat.reduce((acc, memberName) => {
  const hasExclusions = secretSantaGroupMembersInfo.find((member) => member.memberName === memberName).exclusions;
  const secretSanta = pickAName(memberName, listRemaining, hasExclusions);
  // eslint-disable-next-line no-param-reassign
  listRemaining = remove(secretSanta, listRemaining); // remove allocated secretSanta from listRemaining
  return [...acc, { memberName, secretSanta }];
}, []);

module.exports = {
  getListOfNames,
  remove,
  generateDraw
};
