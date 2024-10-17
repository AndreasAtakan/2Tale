<?php

/**/

//$data = json_decode(file_get_contents("php://input"), true);

$file = $_POST["file"];
file_put_contents("/tmp/test.jpg", base64_decode($file));
exit;

$name = $_FILES["file"]["name"];
$size = $_FILES["file"]["size"];
$path = "/tmp/" . basename($name);
$fileType = strtolower( pathinfo($file, PATHINFO_EXTENSION) );
$uploadOk = 1;

if(isset($_POST["submit"])) {
	$check = getimagesize($file);
	if($check !== false) { $uploadOk = 1; }
	else { $uploadOk = 0; }
}

if(file_exists($path)) { $uploadOk = 0; }

if($size > 500000) { $uploadOk = 0; }

if($fileType != "png"
&& $fileType != "jpg"
&& $fileType != "jpeg" ) { $uploadOk = 0; }

if ($uploadOk == 1) {
	if(move_uploaded_file($file, $path)) {
		echo "Success"; exit;
	}
	else { echo "Upload error"; exit(1); }
}
else { echo "Upload error"; exit(1); }
