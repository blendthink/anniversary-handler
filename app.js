const {App, ExpressReceiver} = require('@slack/bolt');
const serverlessExpress = require('@vendia/serverless-express');
const axiosBase = require('axios');
const axios = axiosBase.create({
    baseURL: 'https://api.github.com',
    headers: {
        "Authorization": `token ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`,
        "Accept": "application/vnd.github.v3+json"
    }
});

// カスタムのレシーバーを初期化します
const expressReceiver = new ExpressReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    // `processBeforeResponse` オプションは、あらゆる FaaS 環境で必須です。
    // このオプションにより、Bolt フレームワークが `ack()` などでリクエストへの応答を返す前に
    // `app.message` などのメソッドが Slack からのリクエストを処理できるようになります。FaaS では
    // 応答を返した後にハンドラーがただちに終了してしまうため、このオプションの指定が重要になります。
    processBeforeResponse: true
});

// ボットトークンと、AWS Lambda に対応させたレシーバーを使ってアプリを初期化します。
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    receiver: expressReceiver
});

app.command('/anniversary', async ({command, ack, say}) => {
    // Acknowledge command request
    await ack('Running..');

    try {
        const res = await axios.post(process.env.WORKFLOW_DISPATCH_PATH, {
            ref: 'main',
            inputs: {
                type: `${command.text}`
            }
        })
        console.log(res)
    } catch (e) {
        await say(e)
    }
});

// Lambda 関数のイベントを処理します
module.exports.handler = serverlessExpress({
    app: expressReceiver.app
});
