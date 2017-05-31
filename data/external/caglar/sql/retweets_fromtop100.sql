SELECT min(A.fromuser), A.tweet, count(*), min(date::DATE)
  FROM retweet as A INNER JOIN top100retweeted as B ON A.fromuser = B.fromuser group by tweet order by min(date::DATE);
