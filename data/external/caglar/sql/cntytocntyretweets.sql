SELECT D.homecntyid as from, C.homecntyid as to, count(*)
  FROM retweet as A 
  INNER JOIN namecnty as C ON A.touser = C.name 
  INNER JOIN namecnty as D ON A.fromuser = D.name
  group by C.homecntyid, D.homecntyid;
