# node-binary-search-in-file
How to find string in a big-sized file
Original source: https://github.com/koorchik/jabascript-materials/tree/main/inverted-index
# How it works
1. Run map.js to create file with key-value pairs - node map.js >./pairs.data (add file path inside map.js)
2. Sort the file - sort -k1,1 ./pairs.data >./sorted.data (add file path inside sort command)
3. Run index.js to find the key - node index.js apple 4 (apple is the key, 4 is the number of chunks bytes in the file, depends on the data size and the system memory)
