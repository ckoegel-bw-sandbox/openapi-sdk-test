const NodeSdk = require('franken_spec');
const expect = require('expect.js')

const BW_ACCOUNT_ID = process.env.BW_ACCOUNT_ID;
const BW_USERNAME = process.env.BW_USERNAME;
const BW_PASSWORD = process.env.BW_PASSWORD;
const BW_MESSAGING_APPLICATION_ID = process.env.BW_MESSAGING_APPLICATION_ID;
const BW_VOICE_APPLICATION_ID = process.env.BW_VOICE_APPLICATION_ID;
const BW_NUMBER = process.env.BW_NUMBER;
const USER_NUMBER = process.env.USER_NUMBER;


var apiClient = NodeSdk.ApiClient.instance;
var httpBasic = apiClient.authentications['httpBasic'];
httpBasic.username = BW_USERNAME;
httpBasic.password = BW_PASSWORD;

//-------------Messaging Tests-------------
const messageApi = new  NodeSdk.MessagesApi();
describe("Messaging Tests", function() {
    it("Create SMS Message", function() {
        let message_text = "node sdk test SMS";
        let body = {
            applicationId: BW_MESSAGING_APPLICATION_ID,
            to: [USER_NUMBER],
            from: BW_NUMBER,
            text: message_text
        }
        let response = messageApi.createMessage(BW_ACCOUNT_ID, body);
        console.log(response);
    });
    
});

//console.log(response);

//console.log(apiClient.authentications);