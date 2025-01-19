<!DOCTYPE html>
<html>
<head>
    <title>Reset Password</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
        h2 {
            color: #333333;
            font-size: 24px;
            margin-bottom: 20px;
            text-align: center;
        }
        p {
            color: #555555;
            font-size: 16px;
            line-height: 1.8;
        }
        .button {
        display: block;
        width: fit-content;
        padding: 12px 24px;
        background-color: #10B981;
        color: #ffffff !important; /* Gunakan !important untuk memastikan warna */
        text-decoration: none; /* Menghapus garis bawah */
        border-radius: 5px;
        margin: 20px auto;
        font-weight: bold;
        text-align: center;
        }
        .button:hover {
        background-color: #059669;
        }
        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #777777;
            text-align: center;
            border-top: 1px solid #eeeeee;
            padding-top: 15px;
        }
        .footer p {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Reset Password</h2>
        <p>Halo, {{ $name ?? 'Pengguna' }}</p>

        <p>Anda menerima email ini karena kami menerima permintaan reset password untuk akun Anda. Jika Anda ingin melanjutkan, silakan klik tombol di bawah ini:</p>
        
        <a href="{{ $resetUrl }}" class="button">Reset Password</a>

        <p>Jika Anda tidak meminta reset password, abaikan email ini. Link reset ini akan kedaluwarsa dalam 60 menit.</p>

        <div class="footer">
            <p>Jika Anda mengalami masalah dengan tombol di atas, salin dan tempelkan URL berikut ini ke browser Anda:</p>
            <p><a href="{{ $resetUrl }}" style="color: #047857;">{{ $resetUrl }}</a></p>
        </div>
    </div>
</body>
</html>
