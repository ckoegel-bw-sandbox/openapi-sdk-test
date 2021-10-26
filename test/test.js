const NodeSdk = require('franken_spec');
const assert = require('assert');
const { create } = require('domain');
const { get } = require('http');
const { randomInt } = require('crypto');

const BW_ACCOUNT_ID = process.env.BW_ACCOUNT_ID;
const BW_USERNAME = process.env.BW_USERNAME;
const BW_PASSWORD = process.env.BW_PASSWORD;
const BW_MESSAGING_APPLICATION_ID = process.env.BW_MESSAGING_APPLICATION_ID;
const BW_VOICE_APPLICATION_ID = process.env.BW_VOICE_APPLICATION_ID;
const BW_NUMBER = process.env.BW_NUMBER;
const USER_NUMBER = process.env.USER_NUMBER;
const BASE_CALLBACK_URL = process.env.BASE_CALLBACK_URL;

var apiClient = NodeSdk.ApiClient.instance;
var httpBasic = apiClient.authentications['httpBasic'];
httpBasic.username = BW_USERNAME;
httpBasic.password = BW_PASSWORD;

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

//-------------Messaging and Media Tests-------------
const messageApi = new  NodeSdk.MessagesApi();
describe("Messaging Tests", function() {
    it("Create SMS Message", function(done) {   // Test sending an SMS message
        let messageText = "node sdk test SMS";
        let body = new NodeSdk.MessageRequest(
            BW_MESSAGING_APPLICATION_ID, 
            [USER_NUMBER], 
            BW_NUMBER
        );
        body.text = messageText;
        body.tag = "node tag";

        function responseCallback(err, data, resp) {
            done();
            assert.strictEqual(resp['res']['statusCode'], 202, "incorrect response code");
            assert.strictEqual(data.id.length, 29, "id not set");
            assert.strictEqual(data.owner, BW_NUMBER, "message owner not correct");
            assert.strictEqual(data.from, BW_NUMBER, "from number does not match");
            assert.strictEqual(data.to[0], USER_NUMBER, "to number does not match");
            assert.strictEqual(data.tag, body.tag, "tag does not match");
            assert.strictEqual(data.media, body.media, "media does not match");
            assert.strictEqual(data.text, messageText, "message text does not match");
        };
        messageApi.createMessage(BW_ACCOUNT_ID, body, null, responseCallback);
    });

    it("Create MMS Message", function(done) {   // Test sending an MMS message
        let messageText = "node sdk test MMS";
        let body = new NodeSdk.MessageRequest(
            BW_MESSAGING_APPLICATION_ID, 
            [USER_NUMBER], 
            BW_NUMBER
        );
        body.text = messageText;
        body.tag = "node tag";
        body.media = ["https://cdn2.thecatapi.com/images/MTY3ODIyMQ.jpg"];

        function responseCallback(err, data, resp) {
            done();
            assert.strictEqual(resp['res']['statusCode'], 202, "incorrect response code");
            assert.strictEqual(data.id.length, 29, "id not set");
            assert.strictEqual(data.owner, BW_NUMBER, "message owner not correct");
            assert.strictEqual(data.from, BW_NUMBER, "from number does not match");
            assert.strictEqual(data.to[0], USER_NUMBER, "to number does not match");
            assert.strictEqual(data.tag, body.tag, "tag does not match");
            assert.strictEqual(data.media[0], body.media[0], "media does not match");
            assert.strictEqual(data.text, messageText, "message text does not match");
        };
        messageApi.createMessage(BW_ACCOUNT_ID, body, null, responseCallback);
    });

    it("Get Message", function(done) {  // Test to get most recent message from the BW_NUMBER
        let getOpts = {
            sourceTn: BW_NUMBER,
            messageDirection: "OUTBOUND"
        };
        
        function responseCallback(err, data, resp) {
            done();
            assert.strictEqual(resp['res']['statusCode'], 200, "incorrect response code");
            assert.strictEqual(data.messages[0].accountId, BW_ACCOUNT_ID, "id does not match");
            assert.strictEqual(data.messages[0].messageDirection, "OUTBOUND", "message direction does not match");
            assert.strictEqual(data.messages[0].sourceTn, BW_NUMBER, "failed to get message from BW_NUMBER");
        };
        messageApi.getMessages(BW_ACCOUNT_ID, getOpts, responseCallback);
    });

    it("Create SMS with Invalid Number", function(done) {   // Test to make sure correct errors are thrown when trying to send a text to an invalid number
        let messageText = "node sdk test";
        let body = new NodeSdk.MessageRequest(
            BW_MESSAGING_APPLICATION_ID, 
            ["+1invalid"], 
            BW_NUMBER
        );
        body.text = messageText;
        let expectedDesc = "\'+1invalid\' must be replaced with a valid E164 formatted telephone number";

        function responseCallback(err, data, resp) {
            done();
            errorText = JSON.parse(err['response']['text']);
            assert.strictEqualdata, (null, "expected exception not raised");
            assert.strictEqual(err['status'], 400, "incorrect response code");
            assert.strictEqual(errorText['fieldErrors'][0]['description'], expectedDesc, "error description does not match expected");
        };
        messageApi.createMessage(BW_ACCOUNT_ID, body, null, responseCallback);
    });
    
});

const mediaApi = new NodeSdk.MediaApi();
describe("Media Tests", function() {
    let mediaName = 'node_media' + Date.now();
    let mediaData = '123456';
    it("Upload, List, Get, and Delete Media", function(done){  // Test Media Upload, List, Get, and Delete
        function uploadCallback(err, data, resp) {  // Upload
            assert.strictEqual(resp['res']['statusCode'], 204, "incorrect response code");

            function listCallback(err, data, resp) {    // List
                assert.strictEqual(resp['res']['statusCode'], 200, "incorrect response code");
                assert(data[0].contentLength > 0, "media data does not exist");
            };
            mediaApi.listMedia(BW_ACCOUNT_ID, null, listCallback);

            function getCallback(err, data, resp) {     // Get
                assert.strictEqual(resp['res']['statusCode'], 200, "incorrect response code");
                assert.strictEqual(Number(resp['res']['headers']['content-length']), mediaData.length, "media data length does not match");
            };
            mediaApi.getMedia(BW_ACCOUNT_ID, mediaName, null, getCallback);

            function delCallback(err, data, resp) {     // Delete
                done();
                assert.strictEqual(resp['res']['statusCode'], 204, "incorrect response code");
            };
            mediaApi.deleteMedia(BW_ACCOUNT_ID, mediaName, null, delCallback);
        };
        mediaApi.uploadMedia(BW_ACCOUNT_ID, mediaName, mediaData, null, uploadCallback);
    });

    it("Get and Delete Invalid Media", function(done) {     // Test to make sure correct errors are thrown when trying to list and get media that does not exist
        let mediaName = "invalid_media";
        function getCallback(err, data, resp) {
            errorText = JSON.parse(err['response']['text']);
            assert.strictEqual(data, null, "expected exception not raised");
            assert.strictEqual(err['status'], 404, "incorrect response code");
            assert.strictEqual("object-not-found", errorText['type'], "response error type does not match");
        };
        mediaApi.getMedia(BW_ACCOUNT_ID, mediaName, null, getCallback);

        function delCallback(err, data, resp) {
            done();
            assert.strictEqual(resp['res']['statusCode'], 204, "incorrect response code");
        };
        mediaApi.deleteMedia(BW_ACCOUNT_ID, mediaName, null, delCallback);
    });
});

//-------------Voice Tests-------------
const voiceApi = new NodeSdk.CallsApi();
describe("Voice Tests", function() {
    it("Create Call and Get Call State", function(done){    // Test to create an outbound call and get its state
        let amdConfig = new NodeSdk.MachineDetectionConfiguration();
        amdConfig.mode = "async";
        amdConfig.detectionTimeout = 5.0;
        amdConfig.silenceTimeout = 5.0;
        amdConfig.speechThreshold = 5.0;
        amdConfig.speechEndThreshold = 5.0;
        amdConfig.delayResult = true;
        amdConfig.callbackUrl = BASE_CALLBACK_URL + "/machineDetection";
        amdConfig.callbackMethod = "POST";

        let callBody = new NodeSdk.CreateCallRequest(
            BW_NUMBER,
            USER_NUMBER,
            BASE_CALLBACK_URL + "/callbacks/answer",
            BW_VOICE_APPLICATION_ID
        );
        callBody.answerMethod = "POST";
        callBody.disconnectUrl = BASE_CALLBACK_URL + "/callbacks/disconnect";
        callBody.disconnectMethod = "GET";
        callBody.machineDetection = amdConfig;

        let callId = "";

        function createCallback(err, data, resp) {
            callId = data.callId;
            assert.strictEqual(resp['res']['statusCode'], 201, "incorrect response code");
            assert.strictEqual(data.callId.length, 47, "id not set");
            assert.strictEqual(data.accountId, BW_ACCOUNT_ID, "account id does not match");
            assert.strictEqual(data.applicationId, BW_VOICE_APPLICATION_ID, "application id does not match");
            assert.strictEqual(data.to, USER_NUMBER, "to number does not match");
            assert.strictEqual(data.from, BW_NUMBER, "from number does not match");
            assert.strictEqual(data.callUrl, "https://voice.bandwidth.com/api/v2/accounts/" + BW_ACCOUNT_ID + "/calls/" + data.callId, "call url does not match");
            assert.strictEqual(typeof data.callTimeout, "number", "incorrect call timeout data type");
            assert.strictEqual(typeof data.callbackTimeout, "number", "incorrect callback timeout data type");
            assert(data.startTime instanceof Date, "incorrect start time data type");
            assert.strictEqual(data.answerMethod, "POST", "answer method does not match");
            assert.strictEqual(data.disconnectMethod, "GET", "disconnect method does not match");
            assert.strictEqual(data.answerUrl, BASE_CALLBACK_URL + "/callbacks/answer", "answer url does not match");
            assert.strictEqual(data.disconnectUrl, BASE_CALLBACK_URL + "/callbacks/disconnect", "disconnect url does not match");

            function getCallback(err, data, resp) {
                done();
                assert.strictEqual(resp['res']['statusCode'], 200, "incorrect response code");
                assert.strictEqual(callId, data.callId, "call id does not match");
                assert.strictEqual(data.accountId, BW_ACCOUNT_ID, "account id does not match");
                assert.strictEqual(data.applicationId, BW_VOICE_APPLICATION_ID, "application id does not match");
                assert(data.startTime instanceof Date, "incorrect start time data type");
                assert(data.lastUpdate instanceof Date, "incorrect last update time data type");
                if (data.answerTime) {
                    assert(data.answerTime instanceof Date, "incorrect answer time data type");
                }
                if (data.endTime) {
                    assert(data.endTime instanceof Date, "incorrect end time data type");
                }
                if (data.disconnectCause == "error") {
                    assert.strictEqual(typeof data.errorMessage, "string", "incorrect error message data type");
                    assert.strictEqual(data.errorId, 36, "error id not set");
                }
            };
            voiceApi.getCall(BW_ACCOUNT_ID, callId, null, getCallback);
        };
        voiceApi.createCall(BW_ACCOUNT_ID, callBody, null, createCallback);
    });

    it("Create and Get Invalid Call", function(done) {  // Test to make sure correct errors are thrown when trying to create a call incorrectly and get a call that does not exist
        let callBody = new NodeSdk.CreateCallRequest(
            BW_NUMBER,
            "=1invalid",
            BASE_CALLBACK_URL + "/callbacks/answer",
            BW_VOICE_APPLICATION_ID
        );
        callBody.answerMethod = "POST";
        callBody.disconnectUrl = BASE_CALLBACK_URL + "/callbacks/disconnect";
        callBody.disconnectMethod = "GET";
        
        let dneId = "does-not-exist";

        function createCallback(err, data, resp) {
            errorText = JSON.parse(err['response']['text']);
            assert.strictEqual(data, null, "expected exception not raised");
            assert.strictEqual(err['status'], 400, "incorrect response code");
            assert.strictEqual(errorText['type'], "validation", "response error type does not match");
        };
        voiceApi.createCall(BW_ACCOUNT_ID, callBody, null, createCallback);

        function getCallback(err, data, resp) {
            done();
            assert.strictEqual(err['status'], 404, "incorrect response code");
        };
        voiceApi.getCall(BW_ACCOUNT_ID, dneId, null, getCallback);
    });
});

//-------------MFA Tests-------------
const mfaApi = new NodeSdk.MFAApi();
describe("MFA Tests", function() {
    it("MFA Messaging Code", function(done) {   // Test to send a messaging mfa code
        let reqSchema = new NodeSdk.TwoFactorCodeRequestSchema(
            USER_NUMBER,
            BW_NUMBER,
            BW_MESSAGING_APPLICATION_ID,
            "Your temporary {NAME} {SCOPE} code is: {CODE}",
            6
        );

        function mfaCallback(err, data, resp) {
            done();
            assert.strictEqual(resp['res']['statusCode'], 200, "incorrect response code");
            assert.strictEqual(data.messageId.length, 29, "message id not set");
        };
        mfaApi.messagingTwoFactor(BW_ACCOUNT_ID, reqSchema, null, mfaCallback);
    });

    it("MFA Failed Messaging Code", function(done) {    // Test to make sure correct errors are thrown when trying to send a messaging mfa code incorrectly
        let reqSchema = new NodeSdk.TwoFactorCodeRequestSchema(
            USER_NUMBER,
            BW_NUMBER,
            BW_MESSAGING_APPLICATION_ID,
            "Your temporary {NAME} {SCOPE} code is: ",
            6
        );

        function mfaCallback(err, data, resp) {
            done();
            errorText = JSON.parse(err['response']['text']);
            assert.strictEqual(data, null, "expected exception not raised");
            assert.strictEqual(err['status'], 400, "incorrect response code");
            assert.strictEqual(errorText['error'], "{CODE} is required in MFA message", "response error does not match");
        };
        mfaApi.messagingTwoFactor(BW_ACCOUNT_ID, reqSchema, null, mfaCallback);
    });

    it("MFA Voice Code", function(done) {   // Test to send a voice mfa code
        let reqSchema = new NodeSdk.TwoFactorCodeRequestSchema(
            USER_NUMBER,
            BW_NUMBER,
            BW_VOICE_APPLICATION_ID,
            "Your temporary {NAME} {SCOPE} code is: {CODE}",
            6
        );

        function mfaCallback(err, data, resp) {
            done();
            assert.strictEqual(resp['res']['statusCode'], 200, "incorrect response code");
            assert.strictEqual(data.callId.length, 47, "call id not set");
        };
        mfaApi.voiceTwoFactor(BW_ACCOUNT_ID, reqSchema, null, mfaCallback);
    });

    it("MFA Failed Voice Code", function(done) {    // Test to make sure correct errors are thrown when trying to send a voice mfa code incorrectly
        let reqSchema = new NodeSdk.TwoFactorCodeRequestSchema(
            USER_NUMBER,
            BW_NUMBER,
            BW_VOICE_APPLICATION_ID,
            "Your temporary {NAME} {SCOPE} code is: ",
            6
        );

        function mfaCallback(err, data, resp) {
            done();
            
            assert.strictEqual(data, null, "expected exception not raised");
            assert.strictEqual(err['status'], 400, "incorrect response code");
            assert.strictEqual(errorText['error'], "{CODE} is required in MFA message", "response error does not match");
        };
        mfaApi.voiceTwoFactor(BW_ACCOUNT_ID, reqSchema, null, mfaCallback);
    });

    it.skip("MFA Verify Code", function(done) { // Test to verify a correct received mfa code
        let reqSchema = new NodeSdk.TwoFactorVerifyRequestSchema(
            "+1000" + (Math.floor(Math.random() * 1000000) +1),
            BW_VOICE_APPLICATION_ID,
            3,
            "123456"
        );

        function mfaCallback(err, data, resp) {
            done();
            assert.strictEqual(resp['res']['statusCode'], 200, "incorrect response code");
            assert.strictEqual(data.valid, true, "incorrect valid data type");
        };
        mfaApi.verifyTwoFactor(BW_ACCOUNT_ID, reqSchema, null, mfaCallback);
    });

    it("Failed Verify Code", function(done) {   // Test to verify an incorrect received mfa code
        let reqSchema = new NodeSdk.TwoFactorVerifyRequestSchema(
            "+1000" + (Math.floor(Math.random() * 1000000) +1),
            BW_VOICE_APPLICATION_ID,
            3,
            "12345"     // 5 digits so as to never match one randomly generated by previous tests
        );

        function mfaCallback(err, data, resp) {
            done();
            assert.strictEqual(resp['res']['statusCode'], 200, "incorrect response code");
            assert.strictEqual(data.valid, false, "incorrect valid data type");
        };
        mfaApi.verifyTwoFactor(BW_ACCOUNT_ID, reqSchema, null, mfaCallback);
    });
});

//-------------WebRTC Tests-------------
const webRTCApi = new NodeSdk.SessionsApi();
describe("WebRTC Tests", function() {
    it("Create, Get, and Delete Session", function(done) {  // Test to create, get, and delete a webrtc session
        let sessionBody = new NodeSdk.Session();
        sessionBody.tag = "node sdk test";

        function createCallback(err, data, resp) {
            
            let sessionId = data.id;
            assert.strictEqual(resp['res']['statusCode'], 200, "incorrect response code");
            assert.strictEqual(data.id.length, 36, "session id not set");
            assert.strictEqual(data.tag, sessionBody.tag, "created session tag does not match expected");

            function getCallback(err, data, resp) {
                assert.strictEqual(resp['res']['statusCode'], 200, "incorrect response code");
                assert.strictEqual(data.id, sessionId, "session id does not match");
                assert.strictEqual(data.tag, sessionBody.tag, "gotten session tag does not match expected");
            };
            webRTCApi.getSession(BW_ACCOUNT_ID, sessionId, null, getCallback);

            function delCallback(err, data, resp) {
                done();
                assert.strictEqual(resp['res']['statusCode'], 204, "incorrect response code");
            };
            webRTCApi.deleteSession(BW_ACCOUNT_ID, sessionId, null, delCallback);
        };
        webRTCApi.createSession(BW_ACCOUNT_ID, {session: sessionBody}, createCallback);
    });

    it("Failed Get Session", function(done) {   // Test to make sure correct errors are thrown when improperly trying to get session details
        let malfId = "invalid";
        let dneId = "11111111-2222-3333-4444-555555555555";
        let expectedError = "Could not find session for id " + dneId;
        
        function malformedCallback(err, data, resp) {
            errorText = JSON.parse(err['response']['text']);
            assert.strictEqual(err['status'], 400, "incorrect response code");
            assert.strictEqual(errorText['error'], "Malformed session id", "response error does not match");
        };
        webRTCApi.getSession(BW_ACCOUNT_ID, malfId, null, malformedCallback);

        function dneCallback(err, data, resp) {
            done();
            errorText = JSON.parse(err['response']['text']);
            assert.strictEqual(err['status'], 404, "incorrect response code");
            assert.strictEqual(errorText['error'], expectedError, "response error does not match");
        };
        webRTCApi.deleteSession(BW_ACCOUNT_ID, dneId, null, dneCallback);
    });

    const participantsApi = new NodeSdk.ParticipantsApi();
    it("Create, Get, and Delete Participant", function(done) {  // Test to successfully create, get, and delete a webrtc participant
        let partBody = new NodeSdk.Participant();
        partBody.publishPermissions = ["VIDEO", "AUDIO"];
        partBody.deviceApiVersion = "V3";
        partBody.tag = "node sdk test";

        function createCallback(err, data, resp) {
            let partId = data.participant.id;
            assert.strictEqual(resp['res']['statusCode'], 200, "incorrect response code");
            assert.strictEqual(data.participant.id.length, 36, "participant id not set");
            assert.deepStrictEqual(new Set(data.participant.publishPermissions), new Set(partBody.publishPermissions), "participant permissions do not match");
            assert.strictEqual(data.participant.deviceApiVersion, partBody.deviceApiVersion, "participant api version does not match");
            assert.strictEqual(data.participant.tag, partBody.tag, "participant tag does not match");

            function getCallback(err, data, resp) {
                assert.strictEqual(resp['res']['statusCode'], 200, "incorrect response code");
                assert.strictEqual(data.id, partId, "participant id does not match");
                assert.deepStrictEqual(new Set(data.publishPermissions), new Set(partBody.publishPermissions), "participant permissions do not match");
                assert.strictEqual(data.deviceApiVersion, partBody.deviceApiVersion, "participant api version does not match");
                assert.strictEqual(data.tag, partBody.tag, "participant tag does not match");
            };
            participantsApi.getParticipant(BW_ACCOUNT_ID, partId, null, getCallback);

            function delCallback(err, data, resp) {
                done();
                assert.strictEqual(resp['res']['statusCode'], 204, "incorrect response code");
            };
            participantsApi.deleteParticipant(BW_ACCOUNT_ID, partId, null, delCallback);
        };
        participantsApi.createParticipant(BW_ACCOUNT_ID, {participant: partBody}, createCallback);
    });

    it("Failed Create, Get, and Delete Participant", function(done) {   // Test to make sure correct errors are thrown when using invalid participant info
        let partBody = new NodeSdk.Participant();
        partBody.publishPermissions = ["VIDEO", "AUDIO", "INVALID"];
        partBody.deviceApiVersion = "V3";
        partBody.tag = "node sdk test invalid";

        let dneId = "11111111-2222-3333-4444-555555555555";
        let expectedError = "Could not find participant for id " + dneId

        function createCallback(err, data, resp) {
            assert.strictEqual(err['status'], 400, "incorrect response code");
        };
        participantsApi.createParticipant(BW_ACCOUNT_ID, {participant: partBody}, createCallback);

        function getCallback(err, data, resp) {
            errorText = JSON.parse(err['response']['text']);
            assert.strictEqual(err['status'], 404, "incorrect response code");
            assert.strictEqual(errorText['error'], expectedError, "response error does not match");
        };
        participantsApi.getParticipant(BW_ACCOUNT_ID, dneId, null, getCallback);

        function delCallback(err, data, resp) {
            done();
            errorText = JSON.parse(err['response']['text']);
            assert.strictEqual(err['status'], 404, "incorrect response code");
            assert.strictEqual(errorText['error'], expectedError, "response error does not match");
        };
        participantsApi.deleteParticipant(BW_ACCOUNT_ID, dneId, null, delCallback);
    });
});


//-------------TN Lookup Tests-------------
const tnLookupApi = new NodeSdk.PhoneNumberLookupApi();
describe("TN Lookup Tests", function() {
    it("Create and Get TN Lookup", function(done) {     // Test to create and get the status of a TN Lookup Request
        let tnBody = new NodeSdk.OrderRequest();
        tnBody.tns = [BW_NUMBER];

        function createCallback(err, data, resp) {
            let requestId = data.requestId;
            assert.strictEqual(resp['res']['statusCode'], 202, "incorrect response code");
            assert.strictEqual(data.requestId.length, 36, "request id not set");
            assert.strictEqual(typeof data.status , "string", "incorrect status data type");

            function getCallback(err, data, resp) {
                done();
                assert.strictEqual(resp['res']['statusCode'], 200, "incorrect response code");
                assert.strictEqual(data.requestId, requestId, "request id does not match");
                assert.strictEqual(typeof data.status, "string", "incorrect response status type");
                assert.strictEqual(typeof data.result[0]['Response Code'], "number", "incorrect response code type");
                assert.strictEqual(data.result[0]['E.164 Format'], BW_NUMBER, "phone number does not match");
            };
            tnLookupApi.lookupRequestStatus(BW_ACCOUNT_ID, requestId, null, getCallback);
        };
        tnLookupApi.lookupRequest(BW_ACCOUNT_ID, tnBody, null, createCallback);
    });

    it("Failed Create and Get TN Lookup", function(done) {  // Test to make sure correct errors are thrown when trying to improperly create and get a TN Lookup Request
        let tnBody = new NodeSdk.OrderRequest();
        tnBody.tns = ["+1invalid"];

        let dneReqId = "invalid";
        let expectedError = "Some tns do not match e164 format: " + tnBody.tns[0];

        function createCallback(err, data, resp) {
            errorText = JSON.parse(err['response']['text']);
            assert.strictEqual(err['status'], 400, "incorrect response code");
            assert.strictEqual(errorText['message'], expectedError, "response error does not match");
        };
        tnLookupApi.lookupRequest(BW_ACCOUNT_ID, tnBody, null, createCallback);

        function getCallback(err, data, resp) {
            done();
            assert.strictEqual(err['status'], 404, "incorrect response code");
        };
        tnLookupApi.lookupRequestStatus(BW_ACCOUNT_ID, tnBody, null, getCallback);
    });
});
