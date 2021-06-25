const getColorForPercentage = require("../utils/getColorForPercentage");

async function calculateCongestion(congestionParams) {
  const congestionData =
    congestionParams && congestionParams.length
      ? congestionParams.map((param, index) => {
          const { baseDuration, duration } = param
            ? param
            : { baseDuration: 1, duration: 1 };
          const congestionValue =
            duration / baseDuration < 1 ? 1 : duration / baseDuration;
          const normalizedCongestion = Math.min(congestionValue - 1, 1);
          return {
            congestionValue,
            congestionColor: getColorForPercentage(normalizedCongestion),
          };
        })
      : [];
  return congestionData;
}

module.exports = calculateCongestion;
