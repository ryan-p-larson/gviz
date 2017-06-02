"""
GeoVisualization Project
-------------------------

utitilities.py
Author: Ryan Larson
"""

## Libraries
# dir creation
from time import strftime
from os import mkdir, listdir
from os.path import exists as check_file

# tweet date formatting
from datetime import datetime, timedelta
from email.utils import parsedate_tz

# data analysis
import pandas as pd



## Variables

# twitter scrape vars
cols_scrape = ['date', 'username', 'tweetID', 'message', 'retweet', 'longitude', 'latitude' ]
cols_all = ['date', 'username', 'tweetID', 'userID', 'message', 'retweet', 'longitude', 'latitude', 'followersCount',
'friendsCount',
'joinDay',
'favouritesCount',
'language',
'statusesCount']



## Helpers
# make dirs + names
format_dir_date = strftime('%m-%d') + '/'
def make_new_dir_date(d):
    """
    Function to create a new folder at the specified directory.
    Returns the path of the directory as a string
    """
    dir_name = d + format_dir_date      # dir name
    if (check_file(dir_name) == False):
        mkdir(dir_name)
    else:
        print ('Directory already exists, but you can still have the file name')
    return dir_name
def name_file_path(f, d):
    """
    Function to simply concat a file path and name.
    """
    return d + f

def format_new_file(fpath, annotation):
    """
    Function to take a file + path, then an altered **file**
    """
    if (check_file(fpath) == False):
        print ('That file doesnt exist')
    else:
        f = fpath.split('/')[-1]
        split = f.split('.')
        return split[0] +'-'+ annotation +'.'+ split[1]

def ls_files_list(d):
    """
    Function to take a directory path and return a list of all of the files (that aren't logs).
    """
    try:
        not_logs = [d + x for x in  listdir(d)
           if (x.split('.')[0][-4:] != '_log')]
        return not_logs
    except Exception as e:
        print (e)


# tweets
def format_tweet_date(t):
    """
    Function to take a Tweet timestamp and return the date of t
    Modified from: http://stackoverflow.com/questions/3743222/how-do-i-convert-datetime-to-date-in-python
    """
    time_tuple = parsedate_tz(t.strip())
    dt = datetime(*time_tuple[:6])
    corrected_dt = dt - timedelta(seconds=time_tuple[-1])
    # return just the day
    return corrected_dt.date()




## Directories
# top level
root_dir = '../../'
viz_dir = root_dir + 'viz/'
data_dir = root_dir + 'data/'
# data subdirs
external_data_dir = data_dir + 'external/'
external_scrape_dir = external_data_dir + 'scrape/'
external_maps_dir = external_data_dir + 'maps/'
external_cag_dir = external_data_dir + 'caglar/'

processed_data_dir = data_dir + 'processed/'
processed_classifier_dir = processed_data_dir + 'class/'
processed_scrape_dir = processed_data_dir + 'scrape/'
processed_finals_dir = processed_data_dir + 'finals/'
processed_web_dir = processed_data_dir + 'web/'

## Files
# ext
classifier_f = external_data_dir + 'classifier/twitter-hate-speech-classifier.csv'
hate_speech_f = external_data_dir + 'hatebase/hatebase.csv'
# maps
counties_f = name_file_path('attributes.json', external_maps_dir)
states_f = name_file_path('state.geo.json', external_maps_dir)
world_f = name_file_path('110m.json', external_maps_dir)
# DB
tweet_db_f = name_file_path('raw-tweets.db', processed_scrape_dir)
# tweet counties
top_retweets = [
    'top10000_mostretweeted_alltimes.csv',
    'top10000_mostretweeted_dayafter.csv',
    'top10000_mostretweeted_daybefore.csv',
    'top10000_mostretweeted_monthafter.csv',
    'top10000_mostretweeted_monthbefore.csv',
    'top10000_mostretweeted_weekafter.csv',
    'top10000_mostretweeted_weekbefore.csv'
    ]
top_retweets = [name_file_path(x, external_cag_dir) for x in top_retweets]
top_mentions = [
    'top10000_mostmentioned_alltimes.csv',
    'top10000_mostmentioned_dayafter.csv',
    'top10000_mostmentioned_daybefore.csv',
    'top10000_mostmentioned_monthafter.csv',
    'top10000_mostmentioned_monthbefore.csv',
    'top10000_mostmentioned_weekafter.csv',
    'top10000_mostmentioned_weekbefore.csv'
 ]
top_mentions = [name_file_path(x, external_cag_dir) for x in top_mentions]
