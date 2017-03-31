#!/usr/bin/python
"""
"""
import sys, os, codecs

import json
import numpy
from . import ldig

import pandas as pd
import numpy as np
from multiprocessing import Pool


class Detector(object):
    def __init__(self, modeldir):
        self.ldig = ldig.ldig(modeldir)
        self.features = self.ldig.load_features()
        self.trie = self.ldig.load_da()
        self.labels = self.ldig.load_labels()
        self.param = numpy.load(self.ldig.param)

    def detect(self, st):
        label, text, org_text = ldig.normalize_text(st)
        events = self.trie.extract_features("\u0001" + text + "\u0001")
        sum = numpy.zeros(len(self.labels))

        data = []
        for id in sorted(events, key=lambda id:self.features[id][0]):
            phi = self.param[id,]
            sum += phi * events[id]
            #data.append({"id":int(id), "feature":self.features[id][0], "phi":["%0.3f" % x for x in phi]})
        exp_w = numpy.exp(sum - sum.max())
        prob = exp_w / exp_w.sum()

        return {"labels":self.labels, "prob":["%0.3f" % x for x in prob]}

    def predict_to_df(self, json):
        """
        """
        # grab rel variables as lists
        langs = json['labels']
        probs = json['prob']

        # create pandas DF
        df = pd.DataFrame({
            'lang': langs,
            'prob': probs
        })
        return df

    def get_highest_df_prob(self, df):
        """
        """
        # grab row with highest language probability
        idx = df.prob.idxmax()

        # return the language of the highest prob (most confident)
        return df.iloc[idx]['lang']

    def get_tweet_lang(self, tweet):
        """
        """
        pred_probs = self.detect(tweet)
        pred_df = self.predict_to_df(pred_probs)
        pred_lang = self.get_highest_df_prob(pred_df)

        return pred_lang

    def vector_tweet_lang(self, tweet):
        pred_probs = self.detect(tweet)
        idx_highest = np.argmax(pred_probs['prob'])
        return pred_probs['lang'][idx_highest]

    def get_scrape_lang(self, tweets):
        """
        tweets -- Pandas DataFrame
        """
        # drop all of the tweets who don't have a message
        tweets.dropna(subset=['message'], inplace=True)

        # Classify language
        tweets['pred_lang'] = tweets.message.apply(lambda x: self.get_tweet_lang(x))

        return tweets


# for importing
#print (os.getcwd())
#detector = Detector('../src/ldig/models/model.latin/')
