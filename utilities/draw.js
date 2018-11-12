const getListOfNames = (secretSantaData) => secretSantaData.reduce((acc, member) => [...acc, member.memberName], []);

const remove = (name, list) => list.filter((i) => i !== name);

const getRandomName = (list) => list[Math.floor(Math.random() * list.length)];

const pickAName = (memberName, namesList, exclusions) => {
  const filteredList = remove(memberName, namesList);

  let filteredListIncExclusions;
  if (exclusions && exclusions.length) {
    filteredListIncExclusions = filteredList.filter((name) => !exclusions.includes(name));
  }

  return exclusions
    && exclusions.length
    ? getRandomName(filteredListIncExclusions)
    : getRandomName(filteredList);
};

// let retry = false;

const generateDraw = (namesInHat, listRemaining, secretSantaGroupMembersInfo, retry = 0) => {
  if (retry > 10) { throw new Error('Draw not possible'); }
  const result = namesInHat.reduce((acc, memberName) => {
    const hasExclusions = secretSantaGroupMembersInfo.find((member) => member.memberName === memberName).exclusions;
    const secretSanta = pickAName(memberName, listRemaining, hasExclusions);
    // eslint-disable-next-line no-param-reassign
    listRemaining = remove(secretSanta, listRemaining); // remove allocated secretSanta from listRemaining
    return [...acc, { memberName, secretSanta }];
  }, []);

  // If any secret santa names contain undefined, redraw
  if (result.some(({ secretSanta }) => !secretSanta)) {
    return generateDraw(namesInHat, Object.assign([], namesInHat), secretSantaGroupMembersInfo, retry + 1);
  }
  return result;
};

module.exports = {
  getListOfNames,
  remove,
  generateDraw
};
