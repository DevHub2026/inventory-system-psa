<?php

session_start();

if (!isset($_SESSION["user"])) {
    echo "Please login first.";
    exit;
}

if (
    $_SESSION["user"]["role"] !== "staff" &&
    $_SESSION["user"]["role"] !== "admin"
) {
    echo "Access denied.";
    exit;
}

echo "Welcome " . $_SESSION["user"]["name"];
echo "<br>";
echo "You can access regular staff functions.";
?>