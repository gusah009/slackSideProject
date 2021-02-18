const config = require('./config.json');
const convert = require('xml-js');
const request = require('request');
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth() + 1;
const holidayURL = `http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo`
const key = config.serviceKey;
const options = {
        uri:holidayURL,
        qs: {
                solYear: year,
                solMonth: month,
                ServiceKey: key,
        }
}
console.log(options)
request.get(`${holidayURL}?solYear=${year}&ServiceKey=${key}`, function (error, response, body) {

        var xmlToJson = convert.xml2json(body, {compact: true, spaces: 4});

        const holiday = []
        // console.log(`xml to json => ${xmlToJson}`)
        const bodyJson = JSON.parse(xmlToJson);
        const items = bodyJson.response.body.items.item;
        for (item of items) {
          // Ex) 20210308
          const month = item.locdate._text.slice(4, 6);
          const day = item.locdate._text.slice(6, 8);
          holiday.push({
            "month": Number(month),
            "day": Number(day)
          })
        }

        const now = new Date();
        const curYear = now.getFullYear();
        const curMonth = now.getMonth() + 1;
        const curDate = now.getDate();
        console.log(holiday);
        var a = holiday.findIndex(isholy => {
          return isholy.month === 1 && isholy.day === 1;
        });
        console.log(a);
          //callback
});