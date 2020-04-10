cd UTKFace

a=0
for i in *_0_*_*.jpg; do
  new=$(printf "m-%d.jpg" "$a")
  mv -f -i -- "$i" "$new"
  let a=a+1
done


a=0
for i in *_1_*_*.jpg; do
  new=$(printf "f-%d.jpg" "$a")
  mv -f -i -- "$i" "$new"
  let a=a+1
done
