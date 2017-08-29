'use strict';
var https = require('https');
var http = require('http');

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {

    try {
        
        if (event.session.application.applicationId !== "") {
            context.fail("Invalid Application ID");
         }

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
        + ", sessionId=" + session.sessionId);

    // add any session init logic here
}

/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
        + ", sessionId=" + session.sessionId);
    
    var cardTitle = "Dad Joke!";
    var end = '';
    
    console.log(launchRequest);
    
    var req = https.get({
        host: 'icanhazdadjoke.com',
        path: '/',
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    }, function(res) {
        var body = '';
        
        res.on('data', function(chunk) {
            console.log(chunk);
            body += chunk;
        });
        
        res.on('end', function() {
            body = JSON.parse(body);
            end = body.joke;
            callback(session.attributes, buildSpeechletResponse(cardTitle, end, "", "true"));
        });
    });
    
    req.end();
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId
        + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // dispatch custom intents to handlers here
    if (intentName == 'TestIntent') {
        handleTestRequest(intent, session, callback);
    }
    else {
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
        + ", sessionId=" + session.sessionId);

    // Add any cleanup logic here
}

function handleTestRequest(intent, session, callback) {
    var end = '';
    var cardTitle = "Dad Joke!";
    
    var req = https.get({
        host: 'icanhazdadjoke.com',
        path: '/',
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    }, function(res) {
        var body = '';
        
        res.on('data', function(chunk) {
            console.log(chunk);
            body += chunk;
        });
        
        res.on('end', function() {
            body = JSON.parse(body);
            end = body.joke;
            console.log(end);
            callback(session.attributes, buildSpeechletResponse(cardTitle, end, "", "true"));
        });
    });
    
    req.end();
}


// ------- Helper functions to build responses -------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.1",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}
