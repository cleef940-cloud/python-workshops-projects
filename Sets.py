my_set = {1,2,3,4,5}
my_set.add(6)
print(my_set)
my_set.remove(4)
print(my_set)
my_set.discard(4)
print(my_set)
my_set.clear()
print(my_set)
my_set = {1,2,3,4,5}
your_set = {2,3,4,6}

print(your_set.issubset(my_set))
print(my_set.issuperset(your_set))
print(my_set.isdisjoint(your_set))
my_set | your_set
my_set - your_set
my_set ^ your_set
my_set -= your_set
print(my_set)
print(5 in my_set)