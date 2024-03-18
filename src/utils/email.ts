/**
 * FLOW VERIFY EMAIL
 * 1. Server send email to user
 * 2. User click link in email
 * 3. Client send request to server with email_verify_token
 * 4. Server verify email_verify_token
 * 5. Client receive access_token and refresh_token
 * 6. Server update user.verify_status = UserVerifyStatus.Verified
 */
