file1 = open('data/test1.txt', 'r')
file2 = open('data/test2.txt', 'r')

Lines1 = file1.readlines()
Lines2 = file2.readlines()
  
count = 0
# Strips the newline character
res1 = []
res2 = []
for line in Lines1:
    res1.append(float(line.strip().split(" ")[11]))
    # print("Line{}: {}".format(count, res1))
for line in Lines2:
    res2.append(float(line.strip().split(" ")[11]))

import matplotlib.pyplot as plt
import numpy as np
fig = plt.figure()
bins=list(np.arange(0,0.02,0.0001))
plt.hist(res1, bins=bins, label='1')
plt.hist(res2, bins=bins, label='2')
plt.legend(loc='upper right')

# plt.hist(np.clip(pos_sentiments,bins[0], bins[1]), bins=bins)
plt.show()
