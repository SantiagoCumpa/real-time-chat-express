DROP DATABASE rtchat;
CREATE DATABASE IF NOT EXISTS rtchat;
USE rtchat;

CREATE TABLE message (
	id INTEGER AUTO_INCREMENT PRIMARY KEY,
    content TEXT,
    username VARCHAR(255)
);
