const NodeSdk = require('franken_spec');
const expect = require('expect.js')

const BW_ACCOUNT_ID = process.env.BW_ACCOUNT_ID;
const BW_USERNAME = process.env.BW_USERNAME;
const BW_PASSWORD = process.env.BW_PASSWORD;
const BW_MESSAGING_APPLICATION_ID = process.env.BW_MESSAGING_APPLICATION_ID;
const BW_VOICE_APPLICATION_ID = process.env.BW_VOICE_APPLICATION_ID;
const BW_NUMBER = process.env.BW_NUMBER;
const USER_NUMBER = process.env.USER_NUMBER;

const DATA = "_data"


var apiClient = NodeSdk.ApiClient.instance;
//apiClient.returnType = NodeSdk.BandwidthMessage;
var httpBasic = apiClient.authentications['httpBasic'];
httpBasic.username = BW_USERNAME;
httpBasic.password = BW_PASSWORD;
console.log("baseapi return type: ", typeof apiClient.returnType);

var response;
async function testdeeznuts() {
    const messageApi = new  NodeSdk.MessagesApi();
    let message_text = "node sdk test SMS";
    let body = new NodeSdk.MessageRequest(
        BW_MESSAGING_APPLICATION_ID, 
        [USER_NUMBER], 
        BW_NUMBER
    );
    //messageApi.returnType = NodeSdk.BandwidthMessage;
    console.log("messages api return type: ", typeof messageApi.returnType)
    body.text = message_text;
    //let test = new NodeSdk.BandwidthMessage();
    response = messageApi.createMessage(BW_ACCOUNT_ID, body, {}, function(){});
    //let test1 = NodeSdk.BandwidthMessage.constructFromObject(response);
    //response = messageApi.createMessage(BW_ACCOUNT_ID, test1);
    return response
}
(async() => {
    await testdeeznuts();
    console.log("type:", typeof response)
    console.log("is it a bwmessage?", response instanceof NodeSdk.BandwidthMessage);
    console.log("response: ", response)
})();
console.log("type:", typeof response)
console.log("#2", response instanceof NodeSdk.BandwidthMessage);
//console.log("response: ", response)




//-------------Messaging and Media Tests-------------
// const messageApi = new  NodeSdk.MessagesApi();
// describe("Messaging Tests", function() {
//     it("Create SMS Message", function() {
//         let message_text = "node sdk test SMS";
//         let body = new NodeSdk.MessageRequest(
//             BW_MESSAGING_APPLICATION_ID, 
//             [USER_NUMBER], 
//             BW_NUMBER
//         );
//         //messageApi.returnType = NodeSdk.BandwidthMessage;
//         console.log("messages api return type: ", typeof messageApi.returnType)
//         body.text = message_text;
//         let test = new NodeSdk.BandwidthMessage();
        
//         let response = messageApi.createMessage(BW_ACCOUNT_ID, body, {}, function(){});

//         let test1 = NodeSdk.BandwidthMessage.constructFromObject(response);
//         //response = messageApi.createMessage(BW_ACCOUNT_ID, test1);
//         console.log(typeof response)
//         console.log(response instanceof NodeSdk.BandwidthMessage, test instanceof NodeSdk.BandwidthMessage, test1 instanceof NodeSdk.BandwidthMessage);
//         console.log(response[DATA])
//     });
    
// });
