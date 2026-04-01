<?php
/**
 * CCAvenue Response Handler (PHP Native for OviPanel)
 * Decrypts the status response and redirects the user.
 */

$WORKING_KEY = "77CBADC7443F52193CDD382949264C51"; 

function ccav_decrypt($encText, $workingKey) {
    $key = md5($workingKey, true);
    $iv = hex2bin('000102030405060708090a0b0c0d0e0f');
    $decrypted = openssl_decrypt(hex2bin($encText), 'aes-128-cbc', $key, OPENSSL_RAW_DATA, $iv);
    return $decrypted;
}

if (isset($_POST['encResp'])) {
    $encResp = $_POST['encResp'];
    $decResp = ccav_decrypt($encResp, $WORKING_KEY);
    
    // Parse response into array
    parse_str($decResp, $responseArray);
    
    $order_status = $responseArray['order_status'];
    $order_id = $responseArray['order_id'];

    if ($order_status === 'Success') {
        header("Location: https://gagnersports.com/#/registration-success?orderId=$order_id");
    } else {
        header("Location: https://gagnersports.com/#/payment-failed?orderId=$order_id");
    }
} else {
    echo "No response received from CCAvenue.";
}
?>
