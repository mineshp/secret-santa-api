const {
  addGiftIdeasForMember,
  addExclusionForMember,
  getGiftIdeasForMember,
  updateGiftIdeasLastUpdated,
} = require('../db/wishlist');

const addGiftIdeas = async (ctx) => {
  const { memberName, groupID } = ctx.params;
  const { giftIdeas } = ctx.request.body;

  if (giftIdeas.length < 1) ctx.response.status = 404;

  const payload = {
    memberName,
    groupID,
    giftIdeas: giftIdeas.map((g) => decodeURI(g)),
  };

  ctx.body = await addGiftIdeasForMember(payload);
};

const addExclusions = async (ctx) => {
  const { memberName, groupID } = ctx.params;
  const { exclusions } = ctx.request.body;

  if (exclusions.length < 1) ctx.response.status = 404;

  const payload = {
    memberName,
    groupID,
    exclusions,
  };

  ctx.body = await addExclusionForMember(payload);
};

const getGiftIdeas = async (ctx) => {
  const { memberName, groupID } = ctx.params;

  const payload = {
    memberName,
    groupID,
  };

  const getGifts = await getGiftIdeasForMember(payload);
  ctx.body = getGifts;
};

const setGiftIdeasLastUpdated = async (ctx) => {
  const { memberName, groupID } = ctx.params;
  const { giftIdeasLastUpdated } = ctx.request.body;

  const payload = {
    memberName,
    groupID,
    giftIdeasLastUpdated,
  };
  ctx.body = await updateGiftIdeasLastUpdated(payload);
};

module.exports = {
  addGiftIdeas,
  addExclusions,
  getGiftIdeas,
  setGiftIdeasLastUpdated,
};
