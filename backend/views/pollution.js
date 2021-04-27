const axios = require("axios");
const jsdom = require("jsdom");
const fs = require("fs");
const util = require("util");
const path = require("path");
const cities = require("../utils/cities");
const { JSDOM } = jsdom;
const readFile = util.promisify(fs.readFile);

exports.getPollutionData = async (req, res) => {
  let htmlRes = null;
  const metroCities = cities.metroCities;
  let id = 0;
  try {
    id = parseInt(req.params.id);
  } catch (err) {
    id = 0;
  }
  const useLocalData = false;
  const location = id < metroCities.length ? metroCities[id] : metroCities[0];
  if (!useLocalData) {
    await axios
      .get(
        `https://www.aqi.in/dashboard/india/${location.state}/${location.city}#realdash`
      )
      .then((res) => {
        htmlRes = res.data;
      })
      .catch((err) => {
        console.log(err);
        return res.json({ msg: `Pollution Data unavailable` }).status(404);
      });
  } else {
    try {
      htmlRes = await readFile(path.join(__dirname, "data.html"));
    } catch (err) {
      console.log(err);
      return res.json({ msg: `Pollution Data unavailable` }).status(404);
    }
  }
  try {
    const dom = new JSDOM(htmlRes);
    const citiesDivObj = dom.window.document.getElementsByClassName(
      "cities-of-list"
    );
    const tableHeadingObj = citiesDivObj[0].getElementsByTagName("th");
    const titles = Object.keys(tableHeadingObj).map((key, index) => {
      return tableHeadingObj[key].textContent;
    });
    const tableBodyObj = citiesDivObj[0].getElementsByTagName("td");
    const content = Object.keys(tableBodyObj).map((key, index) => {
      return tableBodyObj[key].textContent;
    });
    let groupedContent = [];
    let singleGroup = [];
    const itemsInGroup = titles.length;
    for (let i = 0; i < content.length; i++) {
      if (i !== 0 && i % itemsInGroup === 0) {
        groupedContent.push(singleGroup);
        singleGroup = [];
        singleGroup.push(content[i].replace(/\s+/, " "));
      } else {
        singleGroup.push(content[i]);
      }
    }
    const data = groupedContent.map((group) => {
      let cityData = {};
      group.forEach((value, index) => {
        cityData[titles[index]] = value;
      });
      return cityData;
    });
    return res
      .json({
        msg: `Pollution Data found!`,
        city: `${location.city}`,
        state: `${location.state}`,
        data: data,
      })
      .status(200);
  } catch (err) {
    console.log(err);
    return res.json({ msg: `Pollution Data unavailable` }).status(404);
  }
};
