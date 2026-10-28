products = {
    'laptop' : 990,
    'Smartphone': 600,
    'Tablet': 250,
    'Headphones':70,
}

for price in products.values():
    print(price)
    
for product in products.keys():
    print(product)    
    
for product in products.items():
    print(product)    
    
for product, price in products.items():
    print(product, price)    
    
for index, price in enumerate(products.values()):
    print(index, price)    
    
for index, product in enumerate(products.items()):
    print(index, product)    