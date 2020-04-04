# taken from https://github.com/MariaLetta/mega-doodles-pack/tree/master/doodles/svg
rm -rf public/images/pics
mkdir -p public/images/pics 
cd public/images/pics

for i in {10..160}
do
    wget https://raw.githubusercontent.com/MariaLetta/mega-doodles-pack/master/doodles/svg/doodle-$i.svg &
done

for i in {1..9}
do
    wget https://raw.githubusercontent.com/MariaLetta/mega-doodles-pack/master/doodles/svg/doodle-0$i.svg &
done

wait
a=1
for i in *.svg; do
  new=$(printf "doodlep-%d.svg" "$a") #04 pad to length of 4
  mv -f -i -- "$i" "$new"
  let a=a+1
done


# get name list
cd ../../..
mkdir -p public/names/txt public/names/pics 
cd public/names/txt
wget https://raw.githubusercontent.com/smashew/NameDatabases/master/NamesDatabases/first%20names/us.txt
