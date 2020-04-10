cd UTKFace

a=1                 
for i in *_0_*_*.jpg; do
  new=$(printf "m-%d.jpg" "$a")
  mv -f -i -- "$i" "$new"
  let a=a+1
done


a=1                 
for i in *_1_*_*.jpg; do
  new=$(printf "f-%d.jpg" "$a")
  mv -f -i -- "$i" "$new"
  let a=a+1
done
