"use strict";

const fs = require("fs");

exports.exists = (filePath) => {
  try {
    fs.accessSync(filePath);
    return true;
  } catch (e) {
    return false;
  }
};
