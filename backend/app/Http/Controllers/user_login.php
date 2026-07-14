<?php

declare(strict_types=1);

session_start();


if ($_SERVER['REQUEST_METHOD'] !== 'POST') {

    echo "Access denied.";
    exit;

}


$username = trim($_POST['username'] ?? '');
$password = $_POST['password'] ?? '';


// Temporary user data
// Password: password123

$users = [

    "eman" => [

        "password" => password_hash("password123", PASSWORD_DEFAULT),
        "name" => "Eman Costan",
        "id_number" => "202601",
        "role" => "admin"


    ],
    
     "carl" => [

        "password" => password_hash("password123", PASSWORD_DEFAULT),
        "name" => "Carl",
        "id_number" => "202602",
        "role" => "staff"

    ],
    "marc" => [
        "password"=> password_hash("password123", PASSWORD_DEFAULT),
        "name" => "Marc",
        "id_number" => "202603",
        "role" => "staff"
    ]

];



if ($username === "" || $password === "") {

    echo "Username and password are required.";
    exit;

}



if (!isset($users[$username])) {

    echo "Invalid username.";
    exit;

}



$user = $users[$username];



if (!password_verify($password, $user["password"])) {

    echo "Wrong password.";
    exit;

}



$_SESSION["user"] = [

    "username" => $username,
    "name" => $user["name"],
    "id_number" => $user["id_number"],
    "role" => $user["role"],
    
    

];



echo "Login Successful!\n\n";

echo "Name: " . $_SESSION["user"]["name"] . "\n";

echo "ID Number: " . $_SESSION["user"]["id_number"];


?>