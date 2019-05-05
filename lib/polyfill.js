Date.prototype.getMonthName = function() {
  let names = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return names[this.getMonth()];
};

Date.prototype.getMonthAbbrev = function() {
  return this.getMonthName().slice(0,3);
}

// https://github.com/uxitten/polyfill/blob/master/string.polyfill.js
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
if (!String.prototype.padStart) {
    String.prototype.padStart = function padStart(targetLength, padString) {
        targetLength = targetLength >> 0; //truncate if number, or convert non-number to 0;
        padString = String(typeof padString !== 'undefined' ? padString : ' ');
        if (this.length >= targetLength) {
            return String(this);
        } else {
            targetLength = targetLength - this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength / padString.length); //append to original to ensure we are longer than needed
            }
            return padString.slice(0, targetLength) + String(this);
        }
    };
}

Date.prototype.toDatabaseString = function() {
  return [this.getFullYear() + "", (this.getMonth()+1+"").padStart(2, "0"), (this.getDate()+"").padStart(2, "0")].join("-") + " " +
    [(this.getHours() + "").padStart(2, "0"), (this.getMinutes() + "").padStart(2, "0"), (this.getSeconds() + "").padStart(2, "0")].join(":");
}
