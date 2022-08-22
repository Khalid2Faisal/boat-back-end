/**
 * It takes a string, a length, a delimiter, and an appendix, and returns a string that is the original
 * string trimmed to the length, with the delimiter removed from the end, and the appendix added to the
 * end
 * @param str - The string to trim.
 * @param length - The maximum length of the string.
 * @param delim - The delimiter to use to separate the string into chunks.
 * @param appendix - The string to append to the end of the truncated string.
 * @returns the trimmed string.
 */
const smartTrim = (str, length, delim, appendix) => {
  if (str.length <= length) return str;

  var trimmedStr = str.substr(0, length + delim.length);

  var lastDelimIndex = trimmedStr.lastIndexOf(delim);
  if (lastDelimIndex >= 0) trimmedStr = trimmedStr.substr(0, lastDelimIndex);

  if (trimmedStr) trimmedStr += appendix;
  return trimmedStr;
};

module.exports = smartTrim;
