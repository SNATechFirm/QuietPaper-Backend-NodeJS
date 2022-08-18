import AWS from 'aws-sdk'
import config from "config";

const aws : any = config.get("aws");

AWS.config.update({
    "accessKeyId": aws.accessKeyId,
    "secretAccessKey": aws.secretAccessKey,
    "region": aws.region,
})
const sns = new AWS.SNS({ apiVersion: '2010-03-31' });

const SNS_TOPIC_ARN = 'arn:aws:sns:ap-south-1:081890807861:zazzi';


export const send_signup_otp = async (countryCode: any, number: any, otp: any) => {
    console.log("in send otp");
    return new Promise(async (resolve, reject) => {
        try {
            number = `+ ${countryCode} ${number}`
            console.log(number);
            await sns.subscribe(
                {
                    Protocol: 'SMS',
                    TopicArn: SNS_TOPIC_ARN,
                    Endpoint: number,
                },
                async function (error, data) {
                    if (error) {
                        console.log('Error in subscribe');
                        // console.log(error);
                    }
                    var params = {
                        Message: otp,
                        PhoneNumber: number,
                        MessageAttributes: {
                            'AWS.SNS.SMS.SMSType': {
                                DataType: 'String',
                                StringValue: 'Transactional',
                            },
                            'AWS.SNS.SMS.SenderID': { DataType: 'String', StringValue: 'DeathFolder' }
                        }
                    };
                    console.log('params:', params);
                    await sns.publish(params, function (err_publish, data) {
                        if (err_publish) {
                            console.log(err_publish);
                            reject(err_publish);
                        } else {
                            console.log(data);
                            resolve(data);
                        }
                    });
                }
            );
        } catch (error) {
            console.log(error)
            reject(error)
        }
    });
}