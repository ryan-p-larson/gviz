SELECT C.homecntyid, count(*)
  FROM retweet as A 
  INNER JOIN top100retweeted as B ON A.fromuser = B.fromuser 
  INNER JOIN namecnty as C ON A.touser = C.name 
  group by C.homecntyid;
