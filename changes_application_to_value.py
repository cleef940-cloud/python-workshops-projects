products = {
    'Laptop': 990,
    'Smartphone': 600,
    'Tablet': 250,
    'Headphones': 70,
}

for product, price in products.items():
    products[product] = round(price * 0.8)
    
print(products)    

for product in enumerate(products):
    print(product)
    
for index , product in enumerate(product):
    print(index,product)
    
for price in enumerate (products.values()):
    print(price)