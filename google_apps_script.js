/**
 * 補助者ヒアリングシート受付 - Google Apps Script
 * 
 * このスクリプトはウェブアプリとしてデプロイし、
 * ヒアリングシートのフォームデータを受け取ってスプレッドシートに保存します。
 * 
 * セットアップ方法は gas_setup_guide.md を参照してください。
 */

// POSTリクエストを受け取る関数
function doPost(e) {
    try {
        var data = JSON.parse(e.postData.contents);

        // アクティブなスプレッドシートの最初のシートを取得
        var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

        // 送信日時
        var timestamp = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');

        // データを行として追加
        var row = [
            timestamp,
            data.name || '',
            data.name_kana || '',
            data.birthday || '',
            data.gender || '',
            data.address || '',
            data.phone || '',
            data.email || '',
            data.emergency_contact || '',
            data.prev_office || '',
            data.experience_years || '',
            data.prev_employment_type || '',
            data.prev_duties || '',
            data.shakosho_exp || '',
            Array.isArray(data.car_skills) ? data.car_skills.join('、') : (data.car_skills || ''),
            data.visited_offices || '',
            Array.isArray(data.pc_skills) ? data.pc_skills.join('、') : (data.pc_skills || ''),
            data.driver_license || '',
            data.own_car || '',
            data.gyosei_plan || '',
            data.other_qualifications || '',
            data.work_days || '',
            data.work_hours || '',
            data.desired_wage || '',
            data.start_date || '',
            data.commute || '',
            data.health || '',
            data.handover_notes || '',
            data.notes || ''
        ];

        sheet.appendRow(row);

        // メール通知（オプション - 必要な場合はコメントアウトを外してください）
        // var recipient = Session.getActiveUser().getEmail();
        // var subject = '【ヒアリングシート】' + (data.name || '名前未入力') + ' さんからの回答';
        // var body = '新しいヒアリングシートの回答がありました。\n\n'
        //          + '氏名: ' + (data.name || '') + '\n'
        //          + '電話: ' + (data.phone || '') + '\n'
        //          + '住所: ' + (data.address || '') + '\n\n'
        //          + 'スプレッドシートで確認してください。';
        // GmailApp.sendEmail(recipient, subject, body);

        // 成功レスポンス
        return ContentService
            .createTextOutput(JSON.stringify({ status: 'success', message: '送信完了' }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        // エラーレスポンス
        return ContentService
            .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

// GETリクエスト（テスト用）
function doGet(e) {
    return ContentService
        .createTextOutput(JSON.stringify({ status: 'ok', message: 'ヒアリングシート受付API稼働中' }))
        .setMimeType(ContentService.MimeType.JSON);
}
