const Slack = require('slack-node');  // 슬랙 모듈 사용
const config = require('./config.json');
const schedule = require('node-schedule');  // 스케줄러 모듈 사용
const { App } = require("@slack/bolt");
const convert = require('xml-js');
const request = require('request');

/* ===== 스케줄러 Time Zone 설정 =====*/
const rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0, new schedule.Range(0, 6)];
rule.hour = 23;
rule.minute = 59;
rule.tz = 'Asia/Seoul';

/* ===== 공휴일 정보 받아오기 =====*/
const holiday = []
const holidayURL = `http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo`
const key = config.serviceKey;

// 매년 1월 1일 공휴일 정보 받아오기
schedule.scheduleJob('0 0 1 1 *', function(){
  const now = new Date();
  const curYear = now.getFullYear();
  holiday.length = 0; // holiday 초기화
  request.get(`${holidayURL}?solYear=${curYear}&ServiceKey=${key}`, function (error, response, body) {

    var xmlToJson = convert.xml2json(body, {compact: true, spaces: 4});
    const bodyJson = JSON.parse(xmlToJson);
    const items = bodyJson.response.body.items.item;
    console.log(items);
    for (item of items) {
      // Ex) 20210308
      const month = item.locdate._text.slice(4, 6);
      const day = item.locdate._text.slice(6, 8);
      holiday.push({
        "month": Number(month),
        "day": Number(day)
      })
    }
  });
});

/* ===== 거북목 알림 기능 Start ===== */
const slack_turtle = new Slack();
slack_turtle.setWebhook(config.webhookUri_turtle);

const send_turtle = async(message) => {
  slack_turtle.webhook({
	  text:message,
	}, function(err, response){
	  console.log(response);
  });
}
function randomHourInit() {
  const turtleNeckAlertHour = [];
  // 10시 ~ 13시 사이 랜덤
  const randomHour1 = Math.floor(Math.random() * 3 + 10);
  turtleNeckAlertHour.push(randomHour1);
  // 14시 ~ 18시 사이 랜덤 2번
  const randomHour2 = Math.floor(Math.random() * 4 + 14);
  const randomHour3 = Math.floor(Math.random() * 4 + 14);
  turtleNeckAlertHour.push(randomHour2);
  turtleNeckAlertHour.push(randomHour3);
  return turtleNeckAlertHour;
}

function randomMinuteInit() {
  const turtleNeckAlertMinute = [];
  const randomMinute = Math.floor(Math.random() * 60);
  turtleNeckAlertMinute.push(randomMinute);
  return turtleNeckAlertMinute;
}
// 매일 공휴일 체크
schedule.scheduleJob('01 00 * * *', function(){
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;
  const curDate = now.getDate();
  const isHoliday = holiday.findindex(isholy => {
    return isholy.month === curMonth && isholy.day === curDate;
  });
  if (isHoliday === -1) { 
    if (1 <= now.getDay() <= 5) {
      const turtleNeckAlertHour = randomHourInit();
      const turtleNeckAlertMinute = randomMinuteInit();
      for (const hour of turtleNeckAlertHour) {
        for (const minute of turtleNeckAlertMinute) {
          schedule.scheduleJob(`${minute} ${hour} ${curDate} ${curMonth} * ${curYear}`, function(){
            send_turtle('🐢🐢🐢🐢🐢🐢🐢🐢🐢🐢🐢🐢🐢🐢🐢');
            send_turtle('');
          });
        }
      }
    }
  }
});
/* ===== 거북목 알림 기능 End ===== */

/* ===== 알람 기능 Start ===== */
const slack_alert = new Slack();
slack_alert.setWebhook(config.webhookUri);

const send = async(message) => {
  slack_alert.webhook({
	  text:message,
	}, function(err, response){
	  console.log(response);
  });
}

// cron-style 사용
// 분 시 일 월 요일(0-6) 연도(생략가능)
schedule.scheduleJob('01 00 * * *', function(){
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;
  const curDate = now.getDate();

  const isHoliday = holiday.findindex(isholy => {
    return isholy.month === curMonth && isholy.day === curDate;
  });
  if (isHoliday === -1) { 
    if (1 <= now.getDay() <= 5) {
      schedule.scheduleJob(`55 12 ${curDate} ${curMonth} * ${curYear}`, function(){
        send('@@@@@@@@@!!!!!!!!점심시간 5분전!!!!!!!!!!!!!@@@@@@@@@@@@@@@');
      });

      schedule.scheduleJob(`55 17 ${curDate} ${curMonth} * ${curYear}`, function(){
        send('퇴근시간 5분전!!!!!!!!!!!!!!!!!!!!!');
        send('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      });
    }
  }
});
/* ===== 알람 기능 End ===== */

/* ===== 패스트캠퍼스 예약기능 Start ===== */
const app = new App({
  token: config.token,
  signingSecret: config.sign
});

let timeTable = [];
const initTimeTable = () => {
  timeTable = [];
  for (let i = 0; i < 24; i+=2) {
    const timeButton = {};
    timeButton.type = "actions";
    timeButton.elements = [];
    
    for (let j = 0; j < 2; j++) {
      const element = {};
      element.type = "button";
      const hour = String(i+j).padStart(2, '0')
      element.text = {type: "plain_text", text: `=${hour}:00 ~ ${hour}:59=\n-`};
      element.style = "primary";
      element.action_id = "clicked" + (i + j);
      timeButton.elements.push(element);
    }
  
    timeTable.push(timeButton);
  }
}

app.message('hello', async ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered
  console.log(message.user)
  await say({
    blocks: timeTable,
  });
});

for (let i = 0; i < 24; i++) {
  app.action('clicked' + i, async ({ body, ack, say }) => {
    // Acknowledge the action
    await ack();
    let test = 1;
    async function repaintTimeTable() {
      try {
        for (cell of timeTable) {
          const elements = cell.elements
          for (element of elements) {
            if (element.action_id === body.actions[0].action_id) {
              let style = element.style;
              if (style === "danger") {
		console.log(body.user.id + "(X)");
		await say(`<@${body.user.id}>`);
                element.text.text = element.text.text.split('\n')[0];
                element.text.text += '\n-';
                element.style = "primary";
              }
              else {
                element.text.text = element.text.text.slice(0, -1)
                const userId = body.user.id;
                let name = "";
                async function getUserInfo() {
                  try {
                    // Call the users.info method using the WebClient
                    return await app.client.users.info({
                      token: config.token,
                      user: userId
                    })
                  }
                  catch (error) {
                    console.error(error);
                  }
                }
                await getUserInfo().then(userInfo => {
                  name = userInfo.user.profile.display_name || userInfo.user.profile.real_name;
                  console.log(name);
                  element.text.text += name;
                  element.style = "danger";
		  console.log(userId + "(O)");
                });
              }
            } else {
            }
          };
        };
      } catch(error) {
        console.log(error);
      }
    }
    repaintTimeTable().then(async () => {
      let block = [
        {
          type: "section",
          text: {
            type: 'mrkdwn',
            text: `*-=-=-=-=-=패스트 캠퍼스 예약=-=-=-=-=-=*`
          },
        }
      ];
      timeTable.forEach(cell => {
        block.push(cell);
      })
      await say({
        blocks:block,
      });
    });
  });
}

// 패스트 캠퍼스 매일 초기화
schedule.scheduleJob('00 00 * * *', function(){
  initTimeTable();
});
/* ===== 패스트캠퍼스 예약기능 End ===== */

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  initTimeTable();

  console.log(process.env.PORT);
  console.log(' Bolt app is running!');
})();

date = new Date();
console.log(date);
