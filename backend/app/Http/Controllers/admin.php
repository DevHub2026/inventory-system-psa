<?php

session_start();

if (!isset($_SESSION["user"])) {
    echo "Please login first.";
    exit;
}

if ($_SESSION["user"]["role"] !== "admin") {
    echo "Access denied. Admin only.";
    exit;
}

echo "Welcome Admin: " . $_SESSION["user"]["name"];
echo "<br><br>";
echo "Admin Panel";
echo "<br>";
echo "You have full system access.";
?>